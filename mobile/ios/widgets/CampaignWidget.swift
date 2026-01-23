import WidgetKit
import SwiftUI

// MARK: - Campaign Data Model
struct CampaignData: Codable {
    let count: Int
    let distributed: Int
}

// MARK: - Timeline Entry
struct CampaignEntry: TimelineEntry {
    let date: Date
    let campaignCount: Int
    let distributedCount: Int
    let error: String?
}

// MARK: - Timeline Provider
struct CampaignProvider: TimelineProvider {
    func placeholder(in context: Context) -> CampaignEntry {
        CampaignEntry(
            date: Date(),
            campaignCount: 0,
            distributedCount: 0,
            error: nil
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (CampaignEntry) -> Void) {
        // For widget gallery and preview
        let entry = CampaignEntry(
            date: Date(),
            campaignCount: 3,
            distributedCount: 12,
            error: nil
        )
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<CampaignEntry>) -> Void) {
        Task {
            let entry = await fetchCampaignData()

            // Update widget every 15 minutes
            let nextUpdate = Calendar.current.date(
                byAdding: .minute,
                value: 15,
                to: Date()
            )!

            let timeline = Timeline(
                entries: [entry],
                policy: .after(nextUpdate)
            )
            completion(timeline)
        }
    }

    private func fetchCampaignData() async -> CampaignEntry {
        // Get API URL from environment or use default
        let apiUrl = ProcessInfo.processInfo.environment["EXPO_PUBLIC_API_URL"] ?? "http://localhost:3000"
        let urlString = "\(apiUrl)/api/campaigns/count"

        guard let url = URL(string: urlString) else {
            return CampaignEntry(
                date: Date(),
                campaignCount: 0,
                distributedCount: 0,
                error: "Invalid URL"
            )
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 10

        do {
            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                return CampaignEntry(
                    date: Date(),
                    campaignCount: 0,
                    distributedCount: 0,
                    error: "API Error"
                )
            }

            let campaignData = try JSONDecoder().decode(CampaignData.self, from: data)

            return CampaignEntry(
                date: Date(),
                campaignCount: campaignData.count,
                distributedCount: campaignData.distributed,
                error: nil
            )
        } catch {
            return CampaignEntry(
                date: Date(),
                campaignCount: 0,
                distributedCount: 0,
                error: error.localizedDescription
            )
        }
    }
}

// MARK: - Widget View
struct CampaignWidgetView: View {
    var entry: CampaignEntry
    @Environment(\.widgetFamily) var widgetFamily

    var body: some View {
        ZStack {
            // Background with coffee brown gradient
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 139/255, green: 69/255, blue: 19/255),
                    Color(red: 101/255, green: 67/255, blue: 33/255)
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            if let error = entry.error {
                // Error state
                VStack(spacing: 8) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.title2)
                        .foregroundColor(.white.opacity(0.9))

                    Text("Unable to load")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.7))
                }
            } else {
                // Normal state with campaign data
                VStack(alignment: .leading, spacing: 8) {
                    // Header
                    HStack {
                        Image(systemName: "cup.and.saucer.fill")
                            .foregroundColor(.white)

                        Text("FreeCoffee")
                            .font(.headline)
                            .foregroundColor(.white)

                        Spacer()
                    }

                    Spacer()

                    // Campaign count
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text("\(entry.campaignCount)")
                            .font(.system(size: widgetFamily == .systemSmall ? 36 : 48, weight: .bold))
                            .foregroundColor(.white)

                        Text(entry.campaignCount == 1 ? "campaign" : "campaigns")
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.9))
                    }

                    // Distributed count (only show in medium/large widgets)
                    if widgetFamily != .systemSmall {
                        Text("\(entry.distributedCount) vouchers sent")
                            .font(.caption2)
                            .foregroundColor(.white.opacity(0.7))
                    }

                    // Last updated
                    Text("Updated \(entry.date, style: .relative) ago")
                        .font(.caption2)
                        .foregroundColor(.white.opacity(0.6))
                }
                .padding(widgetFamily == .systemSmall ? 12 : 16)
            }
        }
        .widgetURL(URL(string: "freecoffee://campaigns"))
    }
}

// MARK: - Widget Configuration
@main
struct CampaignWidget: Widget {
    let kind: String = "CampaignWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(
            kind: kind,
            provider: CampaignProvider()
        ) { entry in
            CampaignWidgetView(entry: entry)
        }
        .configurationDisplayName("FreeCoffee Campaigns")
        .description("Stay updated with available coffee campaigns.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - Widget Preview
struct CampaignWidget_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            // Small widget preview
            CampaignWidgetView(entry: CampaignEntry(
                date: Date(),
                campaignCount: 3,
                distributedCount: 12,
                error: nil
            ))
            .previewContext(WidgetPreviewContext(family: .systemSmall))

            // Medium widget preview
            CampaignWidgetView(entry: CampaignEntry(
                date: Date(),
                campaignCount: 5,
                distributedCount: 24,
                error: nil
            ))
            .previewContext(WidgetPreviewContext(family: .systemMedium))

            // Error state preview
            CampaignWidgetView(entry: CampaignEntry(
                date: Date(),
                campaignCount: 0,
                distributedCount: 0,
                error: "Network Error"
            ))
            .previewContext(WidgetPreviewContext(family: .systemSmall))
        }
    }
}
