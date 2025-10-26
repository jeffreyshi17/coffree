'use client';

import { useState, useEffect } from 'react';
import { FileText, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface MessageLog {
  id: number;
  campaign_id: string;
  marketing_channel: string;
  link: string;
  phone_number: string;
  status: 'success' | 'failed' | 'expired' | 'invalid';
  error_message?: string;
  created_at: string;
}

export default function MessageLogs({ refreshTrigger }: { refreshTrigger: number }) {
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/logs');
      const data = await response.json();
      if (response.ok) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [refreshTrigger]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case 'expired':
        return <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
      case 'invalid':
        return <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200';
      case 'expired':
        return 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200';
      case 'invalid':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200';
    }
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      // Anonymize: show only last 4 digits
      return `(***) ***-${match[3]}`;
    }
    return phone.length > 4 ? `***${phone.slice(-4)}` : phone;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-pink-600 rounded-xl">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Message Logs</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{logs.length} total message{logs.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No messages sent yet. Share a coffee link to get started!</p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(log.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatPhone(log.phone_number)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Campaign: <span className="font-mono">{log.campaign_id}</span>
                        <span className="mx-2">•</span>
                        Channel: <span className="font-mono">{log.marketing_channel}</span>
                      </div>
                      {log.error_message && (
                        <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                          Error: {log.error_message}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {formatDate(log.created_at)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
