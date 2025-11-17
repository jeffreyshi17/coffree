#!/usr/bin/env python3
"""
Coffree Finder - Automatically finds and submits Capital One coffee links from Reddit
"""

import re
import requests
import time
from datetime import datetime
from typing import List, Set, Dict, Optional
import os
from urllib.parse import urlparse, parse_qs
import html
import praw
import sys
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Set up logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Configuration
# Only subreddits that have shown coffree links in the past year
SUBREDDITS = [
    'AwesomeFreebies',  # Most active - 14 posts in past year
    'freebies',         # Active - 2 posts in past year
]

# Reddit search URL template (no authentication needed for public search)
REDDIT_SEARCH_URL = "https://www.reddit.com/r/{}/search.json"

# Your local API endpoint
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:3001')

# Pattern to match coffree links
COFFREE_PATTERN = r'https?://coffree\.capitalone\.com/sms/\?[^"\s<>]+'


class CoffreeFinder:
    def __init__(self):
        logger.info("Initializing CoffreeFinder...")

        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'CoffreeFinder/1.0 (Coffee Link Aggregator)'
        })
        self.found_links: Set[str] = set()

        # Check for Reddit credentials
        client_id = os.getenv('REDDIT_CLIENT_ID', '')
        client_secret = os.getenv('REDDIT_CLIENT_SECRET', '')

        logger.debug(f"Reddit Client ID present: {bool(client_id and client_id != '_your_client_id_here_')}")
        logger.debug(f"Reddit Client Secret present: {bool(client_secret and client_secret != '_your_client_secret_here_')}")

        if not client_id or client_id == '_your_client_id_here_':
            logger.error("❌ REDDIT_CLIENT_ID is missing or invalid!")
            logger.error("Please set the REDDIT_CLIENT_ID environment variable or secret in GitHub Actions")
            sys.exit(1)

        if not client_secret or client_secret == '_your_client_secret_here_':
            logger.error("❌ REDDIT_CLIENT_SECRET is missing or invalid!")
            logger.error("Please set the REDDIT_CLIENT_SECRET environment variable or secret in GitHub Actions")
            sys.exit(1)

        # Initialize Reddit instance with read-only access
        logger.info("Initializing Reddit API connection...")
        try:
            self.reddit = praw.Reddit(
                client_id=client_id,
                client_secret=client_secret,
                user_agent='CoffreeFinder/1.0 (Coffee Link Aggregator)'
            )
            # Test the connection by making a simple API call
            self.reddit.user.me()
            logger.info("✅ Reddit API connection successful (read-only mode)")
        except Exception as e:
            logger.error(f"❌ Failed to connect to Reddit API: {e}")
            logger.error("This usually means your credentials are invalid or expired")
            sys.exit(1)

    def search_reddit(self, subreddit: str, timeframe: str = 'month') -> List[Dict]:
        """
        Search a subreddit for coffree links in posts and comments

        Args:
            subreddit: Name of the subreddit
            timeframe: Time period to search (hour, day, week, month, year, all)

        Returns:
            List of post data dictionaries
        """
        try:
            logger.info(f"🔍 Searching r/{subreddit}...")
            print(f"🔍 Searching r/{subreddit}...")

            # Get the subreddit
            logger.debug(f"Getting subreddit object for r/{subreddit}")
            sub = self.reddit.subreddit(subreddit)

            # Search for coffree links in posts
            logger.debug(f"Searching for 'coffree.capitalone.com' in r/{subreddit} (timeframe: {timeframe})")
            results = sub.search(
                query='coffree.capitalone.com',
                time_filter=timeframe,
                limit=100,
                sort='new'
            )

            # Convert PRAW submission objects to dictionaries
            posts = []
            posts_from_search = set()
            logger.debug("Processing search results...")
            for submission in results:
                posts.append({
                    'title': submission.title,
                    'selftext': submission.selftext,
                    'url': submission.url,
                    'permalink': submission.permalink,
                    'created_utc': submission.created_utc,
                    'id': submission.id,
                    'author': str(submission.author) if submission.author else '[deleted]',
                })
                posts_from_search.add(submission.id)

            logger.debug(f"Found {len(posts)} posts from direct search")

            # Also search broader terms to catch posts where link is only in comments
            logger.debug("Searching for broader terms to catch posts with links in comments")
            broader_results = sub.search(
                query='capital one coffee OR capitalone coffee OR coffree',
                time_filter=timeframe,
                limit=100,
                sort='new'
            )

            # Check comments on these posts for coffree links
            for submission in broader_results:
                # Skip if we already got this from the direct search
                if submission.id in posts_from_search:
                    continue

                try:
                    # Load comments (limit to avoid rate limiting)
                    submission.comments.replace_more(limit=0)

                    # Check if any comment contains coffree link
                    has_coffree_link = False
                    for comment in submission.comments.list()[:50]:  # Check first 50 comments
                        if 'coffree.capitalone.com' in comment.body:
                            has_coffree_link = True
                            break

                    if has_coffree_link:
                        posts.append({
                            'title': submission.title,
                            'selftext': submission.selftext,
                            'url': submission.url,
                            'permalink': submission.permalink,
                            'created_utc': submission.created_utc,
                            'id': submission.id,
                            'author': str(submission.author) if submission.author else '[deleted]',
                        })
                except Exception as comment_error:
                    logger.debug(f"Could not load comments for post {submission.id}: {comment_error}")
                    # Skip posts where we can't load comments
                    continue

            logger.info(f"   Found {len(posts)} posts with coffree links")
            print(f"   Found {len(posts)} posts")
            return posts

        except Exception as e:
            logger.error(f"   ❌ Error searching r/{subreddit}: {e}", exc_info=True)
            print(f"   ❌ Error searching r/{subreddit}: {e}")
            return []

    def extract_links_from_post(self, post: Dict) -> List[str]:
        """
        Extract coffree links from a Reddit post

        Args:
            post: Reddit post data dictionary

        Returns:
            List of coffree links found (with HTML entities decoded)
        """
        links = []

        # Search in title
        title = post.get('title', '')
        links.extend(re.findall(COFFREE_PATTERN, title))

        # Search in selftext (body)
        selftext = post.get('selftext', '')
        links.extend(re.findall(COFFREE_PATTERN, selftext))

        # Search in URL (if it's a link post)
        url = post.get('url', '')
        if 'coffree.capitalone.com' in url:
            links.append(url)

        # Decode HTML entities (e.g., &amp; -> &)
        decoded_links = [html.unescape(link) for link in links]

        return list(set(decoded_links))  # Remove duplicates

    def parse_campaign_id(self, link: str) -> Optional[str]:
        """
        Extract campaign ID from a coffree link

        Args:
            link: Coffree link URL

        Returns:
            Campaign ID or None if not found
        """
        try:
            parsed = urlparse(link)
            params = parse_qs(parsed.query)
            return params.get('cid', [None])[0]
        except Exception:
            return None

    def check_if_submitted(self, link: str) -> bool:
        """
        Check if a link has already been submitted to the API

        Args:
            link: Coffree link to check

        Returns:
            True if already submitted, False otherwise
        """
        campaign_id = self.parse_campaign_id(link)
        if not campaign_id:
            return False

        try:
            # Check if this campaign ID exists in the database
            response = self.session.get(
                f"{API_BASE_URL}/api/check-campaign",
                params={'cid': campaign_id},
                timeout=10
            )

            if response.ok:
                result = response.json()
                return result.get('exists', False)

            return False

        except Exception as e:
            print(f"   ⚠️  Could not check submission status: {e}")
            # If we can't check, assume it's not submitted to avoid missing it
            return False

    def submit_link(self, link: str) -> bool:
        """
        Submit a coffree link to the API

        Args:
            link: Coffree link to submit

        Returns:
            True if submission successful, False otherwise
        """
        try:
            response = self.session.post(
                f"{API_BASE_URL}/api/send-coffee",
                json={'link': link},
                timeout=30
            )

            result = response.json()

            if response.ok:
                print(f"   ✅ Successfully submitted: {result.get('message', 'Success')}")
                return True
            else:
                error = result.get('error', 'Unknown error')
                error_type = result.get('type', '')

                if error_type == 'duplicate':
                    print(f"   ℹ️  Duplicate: {error}")
                elif error_type == 'expired':
                    print(f"   ⏰ Expired: {error}")
                elif error_type == 'invalid':
                    print(f"   ❌ Invalid: {error}")
                else:
                    print(f"   ❌ Error: {error}")

                return False

        except Exception as e:
            print(f"   ❌ Submission failed: {e}")
            return False

    def log_search(self, status: str, campaigns_found: int, new_campaigns: int, campaign_ids: list = None, error: str = None):
        """Log the search activity to the database"""
        try:
            response = requests.post(
                f"{API_BASE_URL}/api/search-logs",
                json={
                    'search_type': 'reddit',
                    'status': status,
                    'campaigns_found': campaigns_found,
                    'new_campaigns': new_campaigns,
                    'campaign_ids': campaign_ids or [],
                    'subreddits_searched': SUBREDDITS,
                    'error_message': error
                },
                timeout=10
            )
            return response.ok
        except Exception as e:
            print(f"⚠️  Failed to log search: {e}")
            return False

    def record_campaign(self, link: str, reddit_post_url: str = None, reddit_subreddit: str = None) -> tuple[bool, bool]:
        """
        Record a campaign in the database

        Returns:
            Tuple of (success, is_new) where:
            - success: True if campaign was recorded or already exists
            - is_new: True if this is a newly created campaign
        """
        try:
            response = requests.post(
                f"{API_BASE_URL}/api/campaigns",
                json={
                    'full_link': link,
                    'source': 'auto',
                    'reddit_post_url': reddit_post_url,
                    'reddit_subreddit': reddit_subreddit
                },
                timeout=10
            )

            if response.ok:
                result = response.json()
                # Check if the campaign was newly created or already existed
                is_new = result.get('created', False)
                return (True, is_new)
            else:
                # Check if it's a duplicate error (campaign already exists)
                try:
                    error_data = response.json()
                    if 'already exists' in error_data.get('error', '').lower():
                        return (True, False)  # Success but not new
                except:
                    pass
                return (False, False)

        except Exception as e:
            # Campaign might already exist, which is fine
            if 'already exists' in str(e).lower():
                return (True, False)
            print(f"⚠️  Failed to record campaign: {e}")
            return (False, False)

    def run(self, timeframe: str = 'month', auto_submit: bool = False):
        """
        Main run loop - search Reddit and optionally submit links

        Args:
            timeframe: Time period to search (hour, day, week, month, year, all)
            auto_submit: If True, automatically submit new links
        """
        import time as time_module
        start_time = time_module.time()

        logger.info("="*80)
        logger.info("Starting Coffree Finder Run")
        logger.info("="*80)
        logger.info(f"Timeframe: {timeframe}")
        logger.info(f"Auto-submit: {'ON' if auto_submit else 'OFF'}")
        logger.info(f"API Base URL: {API_BASE_URL}")
        logger.info(f"Subreddits to search: {', '.join(SUBREDDITS)}")
        logger.info("="*80)

        print(f"\n🚀 Coffree Finder Starting...")
        print(f"📅 Timeframe: {timeframe}")
        print(f"🤖 Auto-submit: {'ON' if auto_submit else 'OFF'}")
        print(f"🌐 API: {API_BASE_URL}\n")

        all_posts = []
        all_unique_links = set()
        has_errors = False

        # Search all subreddits
        for subreddit in SUBREDDITS:
            try:
                posts = self.search_reddit(subreddit, timeframe)

                if not posts:
                    logger.info(f"No posts found in r/{subreddit} (this is normal)")

                for post in posts:
                    links = self.extract_links_from_post(post)

                    if links:  # Only include posts that have coffree links
                        logger.debug(f"Found {len(links)} links in post: {post.get('title', '')[:50]}...")
                        all_unique_links.update(links)
                        all_posts.append({
                            'subreddit': subreddit,
                            'title': post.get('title', ''),
                            'url': f"https://reddit.com{post.get('permalink', '')}",
                            'created': datetime.fromtimestamp(post.get('created_utc', 0)),
                            'links': links
                        })

                # Be nice to Reddit - rate limit
                logger.debug(f"Waiting 2 seconds before next subreddit...")
                time.sleep(2)
            except Exception as e:
                logger.error(f"Error processing subreddit r/{subreddit}: {e}", exc_info=True)
                has_errors = True

        # Process found posts
        logger.info(f"Search complete. Found {len(all_posts)} posts with {len(all_unique_links)} unique links")
        print(f"\n📊 Summary:")
        print(f"   Total posts with coffree links: {len(all_posts)}")
        print(f"   Total unique links found: {len(all_unique_links)}")

        if not all_posts:
            logger.info("No coffree links found in any subreddit (this timeframe may not have any)")
            print("\n   No coffree links found.")
            # Log the search (no results is not necessarily an error)
            self.log_search(
                status='no_results',
                campaigns_found=0,
                new_campaigns=0,
                campaign_ids=[],
                error=None  # Not an error, just no results
            )
            # Only exit with error code if we had actual errors (not just no results)
            if has_errors:
                logger.error("Exiting with error code due to search failures")
                sys.exit(1)
            else:
                logger.info("Search completed successfully with no results")
                print("\n✅ Search completed successfully (no results this time)")
            return

        print(f"\n{'='*80}")
        print("Reddit Posts Found:")
        print(f"{'='*80}\n")

        # Show posts organized by post
        for i, post_info in enumerate(all_posts, 1):
            print(f"📄 Post #{i}")
            print(f"   Subreddit: r/{post_info['subreddit']}")
            print(f"   Title: {post_info['title']}")
            print(f"   Date: {post_info['created'].strftime('%Y-%m-%d %H:%M')}")
            print(f"   Reddit URL: {post_info['url']}")
            print(f"   Links found in this post ({len(post_info['links'])}):")

            for link in post_info['links']:
                campaign_id = self.parse_campaign_id(link)
                print(f"      - {link}")
                print(f"        Campaign ID: {campaign_id}")

            print()

        # Record all found campaigns in the database
        print(f"\n{'='*80}")
        print("Recording Campaigns:")
        print(f"{'='*80}\n")

        recorded_count = 0
        new_campaigns_count = 0
        for link in all_unique_links:
            campaign_id = self.parse_campaign_id(link)

            # Find the Reddit post info for this link
            reddit_post_url = None
            reddit_subreddit = None
            for post_info in all_posts:
                if link in post_info['links']:
                    reddit_post_url = post_info['url']
                    reddit_subreddit = post_info['subreddit']
                    break

            success, is_new = self.record_campaign(link, reddit_post_url, reddit_subreddit)
            if success:
                if is_new:
                    print(f"✅ Recorded NEW Campaign ID: {campaign_id}")
                    new_campaigns_count += 1
                else:
                    print(f"ℹ️  Campaign ID already exists: {campaign_id}")
                recorded_count += 1
            else:
                print(f"⚠️  Could not record Campaign ID: {campaign_id}")

        print(f"\nRecorded {recorded_count}/{len(all_unique_links)} campaigns ({new_campaigns_count} new)\n")

        # Now process submissions if auto_submit is enabled
        submitted_count = 0
        skipped_count = 0
        failed_count = 0

        if auto_submit:
            print(f"\n{'='*80}")
            print("Submitting Links:")
            print(f"{'='*80}\n")

            for link in all_unique_links:
                campaign_id = self.parse_campaign_id(link)
                print(f"🔗 Submitting Campaign ID: {campaign_id}")
                print(f"   Link: {link}")

                # Try to submit
                if self.submit_link(link):
                    submitted_count += 1
                else:
                    failed_count += 1

                print()
        else:
            skipped_count = len(all_unique_links)

        # Final summary
        logger.info("="*80)
        logger.info("Final Summary")
        logger.info("="*80)
        logger.info(f"Posts found: {len(all_posts)}")
        logger.info(f"Unique links: {len(all_unique_links)}")
        if auto_submit:
            logger.info(f"Successfully submitted: {submitted_count}")
            logger.info(f"Failed/Duplicates: {failed_count}")
        else:
            logger.info(f"Skipped (auto-submit disabled): {skipped_count}")
        logger.info("="*80)

        print(f"\n{'='*80}")
        print("Final Summary:")
        print(f"{'='*80}")
        print(f"📄 Posts found: {len(all_posts)}")
        print(f"🔗 Unique links: {len(all_unique_links)}")
        if auto_submit:
            print(f"✅ Successfully submitted: {submitted_count}")
            print(f"❌ Failed/Duplicates: {failed_count}")
        else:
            print(f"⏸️  Skipped (auto-submit disabled): {skipped_count}")

        # Log the search activity
        duration = int(time_module.time() - start_time)
        logger.info(f"Search completed in {duration} seconds")
        print(f"\n⏱️  Search completed in {duration} seconds")
        print(f"📊 Logging search activity...")

        # Extract campaign IDs from all unique links
        campaign_ids = [self.parse_campaign_id(link) for link in all_unique_links]
        campaign_ids = [cid for cid in campaign_ids if cid]  # Filter out None values

        log_success = self.log_search(
            status='success',
            campaigns_found=len(all_unique_links),
            new_campaigns=new_campaigns_count,
            campaign_ids=campaign_ids
        )

        if log_success:
            logger.info("Successfully logged search activity to database")
        else:
            logger.warning("Failed to log search activity to database")

        # Exit with error code if there were any errors during the search
        if has_errors:
            logger.error("Exiting with error code due to errors during search")
            sys.exit(1)

        logger.info("Coffree Finder completed successfully")
        print("\n✅ Coffree Finder completed successfully!")


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description='Find and submit Capital One coffree links from Reddit'
    )
    parser.add_argument(
        '--timeframe',
        choices=['hour', 'day', 'week', 'month', 'year', 'all'],
        default='month',
        help='Time period to search (default: month)'
    )
    parser.add_argument(
        '--auto-submit',
        action='store_true',
        help='Automatically submit found links to the API'
    )
    parser.add_argument(
        '--api-url',
        default='http://localhost:3001',
        help='Base URL for the API (default: http://localhost:3001)'
    )

    args = parser.parse_args()

    # Set API URL from argument
    os.environ['API_BASE_URL'] = args.api_url

    finder = CoffreeFinder()
    finder.run(timeframe=args.timeframe, auto_submit=args.auto_submit)


if __name__ == '__main__':
    main()
