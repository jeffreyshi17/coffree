'use client';

import { useState, useEffect } from 'react';

interface SearchLog {
  id: number;
  search_type: string;
  status: string;
  campaigns_found: number;
  new_campaigns: number;
  subreddits_searched: string[];
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
}

interface Campaign {
  id: number;
  campaign_id: string;
  marketing_channel: string;
  full_link: string;
  source: 'auto' | 'manual';
  reddit_post_url: string | null;
  reddit_subreddit: string | null;
  first_seen_at: string;
  first_submitted_at: string | null;
  is_valid: boolean;
  is_expired: boolean;
  notes: string | null;
}

export default function SearchTracker() {
  const [searchLogs, setSearchLogs] = useState<SearchLog[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns'>('overview');
  const [campaignFilter, setCampaignFilter] = useState<'all' | 'valid' | 'expired'>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsRes, campaignsRes] = await Promise.all([
        fetch('/api/search-logs?limit=10'),
        fetch('/api/campaigns?limit=50')
      ]);

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setSearchLogs(logsData.logs || []);
      }

      if (campaignsRes.ok) {
        const campaignsData = await campaignsRes.json();
        setCampaigns(campaignsData.campaigns || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const lastSearch = searchLogs[0];
  const validCampaigns = campaigns.filter(c => c.is_valid && !c.is_expired);
  const expiredCampaigns = campaigns.filter(c => c.is_expired);

  const filteredCampaigns = campaigns.filter(c => {
    if (campaignFilter === 'valid') return c.is_valid && !c.is_expired;
    if (campaignFilter === 'expired') return c.is_expired;
    return true;
  });

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Reddit Search Tracker
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Monitor automated searches and discovered campaigns
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-6 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'campaigns'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Campaigns ({campaigns.length})
          </button>
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Last Search Summary */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Last Search
              </h3>
              {lastSearch ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                    <span
                      className={`text-sm font-medium ${
                        lastSearch.status === 'success'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {lastSearch.status === 'success' ? '✓ Success' : '✗ Failed'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Time</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {formatTimeAgo(lastSearch.started_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Campaigns Found</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {lastSearch.campaigns_found}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">New Campaigns</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {lastSearch.new_campaigns}
                    </span>
                  </div>
                  {lastSearch.subreddits_searched && lastSearch.subreddits_searched.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Subreddits</span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {lastSearch.subreddits_searched.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No searches recorded yet
                </p>
              )}
            </div>

            {/* Campaign Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {campaigns.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Campaigns</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {validCampaigns.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Valid Campaigns</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {expiredCampaigns.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Expired Campaigns</div>
              </div>
            </div>

            {/* Recent Search History */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Recent Search History
              </h3>
              <div className="space-y-2">
                {searchLogs.length > 0 ? (
                  searchLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded ${
                              log.status === 'success'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}
                          >
                            {log.status}
                          </span>
                          <span className="text-sm text-gray-900 dark:text-white">
                            {formatTimeAgo(log.started_at)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {log.campaigns_found} campaigns found
                          {log.new_campaigns > 0 && ` (${log.new_campaigns} new)`}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No search history yet
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div className="space-y-4">
            {/* Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setCampaignFilter('all')}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  campaignFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                All ({campaigns.length})
              </button>
              <button
                onClick={() => setCampaignFilter('valid')}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  campaignFilter === 'valid'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Valid ({validCampaigns.length})
              </button>
              <button
                onClick={() => setCampaignFilter('expired')}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  campaignFilter === 'expired'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Expired ({expiredCampaigns.length})
              </button>
            </div>

            {/* Campaign List */}
            <div className="space-y-3">
              {filteredCampaigns.length > 0 ? (
                filteredCampaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <code className="text-sm font-mono text-blue-600 dark:text-blue-400">
                            {campaign.campaign_id}
                          </code>
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded ${
                              campaign.source === 'auto'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                                : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'
                            }`}
                          >
                            {campaign.source === 'auto' ? '🤖 Auto' : '✋ Manual'}
                          </span>
                          {campaign.is_valid && !campaign.is_expired && (
                            <span className="text-xs font-medium px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              ✓ Valid
                            </span>
                          )}
                          {campaign.is_expired && (
                            <span className="text-xs font-medium px-2 py-1 rounded bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                              ⏰ Expired
                            </span>
                          )}
                          {!campaign.is_valid && !campaign.is_expired && (
                            <span className="text-xs font-medium px-2 py-1 rounded bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                              ✗ Invalid
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <div>
                            <span className="font-medium">Channel:</span> {campaign.marketing_channel}
                          </div>
                          <div>
                            <span className="font-medium">First seen:</span>{' '}
                            {formatTimeAgo(campaign.first_seen_at)}
                          </div>
                          {campaign.reddit_subreddit && (
                            <div>
                              <span className="font-medium">Found in:</span> r/{campaign.reddit_subreddit}
                              {campaign.reddit_post_url && (
                                <a
                                  href={campaign.reddit_post_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-2 text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  View post →
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                  No campaigns found
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={fetchData}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          {loading ? 'Loading...' : 'Refresh Data'}
        </button>
      </div>
    </div>
  );
}
