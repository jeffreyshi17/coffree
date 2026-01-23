package com.freecoffee.app.widgets

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.app.PendingIntent
import android.widget.RemoteViews
import android.os.Build
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.*
import com.freecoffee.app.R

/**
 * FreeCoffee Campaign Widget
 *
 * Displays the count of available coffee campaigns on the Android home screen.
 * Updates every 15 minutes and fetches data from the backend API.
 */
class CampaignWidget : AppWidgetProvider() {

    companion object {
        private const val UPDATE_INTERVAL_MS = 15 * 60 * 1000L // 15 minutes
        private const val API_TIMEOUT_MS = 10000 // 10 seconds
        private const val ACTION_WIDGET_UPDATE = "com.freecoffee.app.WIDGET_UPDATE"

        // Get API URL from BuildConfig or use default
        private fun getApiUrl(): String {
            // In production, this would come from BuildConfig or environment
            return System.getenv("EXPO_PUBLIC_API_URL") ?: "http://localhost:3000"
        }
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        // Update each widget instance
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onEnabled(context: Context) {
        // First widget added - start updates
        super.onEnabled(context)
    }

    override fun onDisabled(context: Context) {
        // Last widget removed - stop updates
        super.onDisabled(context)
    }

    private fun updateAppWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        // Show loading state
        val loadingViews = RemoteViews(context.packageName, R.layout.campaign_widget)
        loadingViews.setTextViewText(R.id.widget_campaign_count, "...")
        loadingViews.setTextViewText(R.id.widget_label, "Loading...")
        appWidgetManager.updateAppWidget(appWidgetId, loadingViews)

        // Fetch data asynchronously
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val campaignData = fetchCampaignData()

                withContext(Dispatchers.Main) {
                    val views = RemoteViews(context.packageName, R.layout.campaign_widget)

                    // Update widget UI with fetched data
                    views.setTextViewText(
                        R.id.widget_campaign_count,
                        campaignData.count.toString()
                    )

                    val label = if (campaignData.count == 1) "campaign" else "campaigns"
                    views.setTextViewText(R.id.widget_label, label)

                    // Show distributed count
                    views.setTextViewText(
                        R.id.widget_distributed,
                        "${campaignData.distributed} vouchers sent"
                    )

                    // Update timestamp
                    val timeFormat = SimpleDateFormat("h:mm a", Locale.getDefault())
                    val currentTime = timeFormat.format(Date())
                    views.setTextViewText(R.id.widget_updated, "Updated at $currentTime")

                    // Set up click intent to open app
                    val intent = Intent(Intent.ACTION_VIEW).apply {
                        data = Uri.parse("freecoffee://campaigns")
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    }

                    val pendingIntent = PendingIntent.getActivity(
                        context,
                        0,
                        intent,
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                        } else {
                            PendingIntent.FLAG_UPDATE_CURRENT
                        }
                    )
                    views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)

                    // Update the widget
                    appWidgetManager.updateAppWidget(appWidgetId, views)
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    // Show error state
                    val errorViews = RemoteViews(context.packageName, R.layout.campaign_widget)
                    errorViews.setTextViewText(R.id.widget_campaign_count, "!")
                    errorViews.setTextViewText(R.id.widget_label, "Unable to load")
                    errorViews.setTextViewText(R.id.widget_distributed, "")
                    errorViews.setTextViewText(R.id.widget_updated, "Tap to retry")

                    appWidgetManager.updateAppWidget(appWidgetId, errorViews)
                }
            }
        }
    }

    /**
     * Fetch campaign count data from the API
     */
    private suspend fun fetchCampaignData(): CampaignData {
        return withContext(Dispatchers.IO) {
            val apiUrl = getApiUrl()
            val urlString = "$apiUrl/api/campaigns/count"
            val url = URL(urlString)

            val connection = url.openConnection() as HttpURLConnection
            try {
                connection.requestMethod = "GET"
                connection.setRequestProperty("Content-Type", "application/json")
                connection.connectTimeout = API_TIMEOUT_MS
                connection.readTimeout = API_TIMEOUT_MS

                val responseCode = connection.responseCode
                if (responseCode == HttpURLConnection.HTTP_OK) {
                    val response = connection.inputStream.bufferedReader().use { it.readText() }
                    val json = JSONObject(response)

                    CampaignData(
                        count = json.optInt("count", 0),
                        distributed = json.optInt("distributed", 0)
                    )
                } else {
                    throw Exception("API returned status $responseCode")
                }
            } finally {
                connection.disconnect()
            }
        }
    }
}

/**
 * Data class to hold campaign count information
 */
data class CampaignData(
    val count: Int,
    val distributed: Int
)
