// app/admin/cache/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { firestoreInterviewCache } from '@/lib/cache/firestoreInterviewCache';

export default function CacheDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const cacheStats = await firestoreInterviewCache.getCacheStats();
      setStats(cacheStats);
    } catch (error) {
      console.error("Error loading cache stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    try {
      const results = await firestoreInterviewCache.searchCachedInterviews(searchTerm);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching cache:", error);
    }
  };

  const handleCleanup = async () => {
    if (confirm('Clean up old cache entries (unused for 30 days)?')) {
      try {
        const deleted = await firestoreInterviewCache.cleanupCache(30, 1);
        alert(`Cleaned up ${deleted} cache entries`);
        loadStats();
      } catch (error) {
        console.error("Error cleaning up cache:", error);
      }
    }
  };

  if (loading) {
    return <div className="p-8">Loading cache statistics...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Interview Question Cache</h1>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-blue-600">Total Cached</div>
          <div className="text-2xl font-bold">{stats?.totalCached || 0}</div>
          <div className="text-sm text-gray-500">interviews</div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm text-green-600">Total Uses</div>
          <div className="text-2xl font-bold">{stats?.totalUses || 0}</div>
          <div className="text-sm text-gray-500">times used</div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-sm text-purple-600">Hit Rate</div>
          <div className="text-2xl font-bold">{stats?.hitRate || 0}%</div>
          <div className="text-sm text-gray-500">cache efficiency</div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-sm text-yellow-600">Recent Adds</div>
          <div className="text-2xl font-bold">{stats?.recentAdditions?.length || 0}</div>
          <div className="text-sm text-gray-500">last 5 entries</div>
        </div>
      </div>

      {/* Search Section */}
      <div className="mb-8">
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search cached interviews by role or tag..."
            className="flex-1 px-4 py-2 border rounded"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Search
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="border rounded-lg">
            <div className="p-4 font-semibold border-b">
              Search Results ({searchResults.length})
            </div>
            {searchResults.map((interview) => (
              <div key={interview.id} className="p-4 border-b hover:bg-gray-50">
                <div className="flex justify-between">
                  <div>
                    <span className="font-medium">{interview.role}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      ({interview.level} • {interview.interviewType})
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Used </span>
                    <span className="font-semibold">{interview.metadata.usageCount}</span>
                    <span className="text-gray-600"> times</span>
                  </div>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {interview.questions.length} questions •
                  Added {new Date(interview.metadata.createdAt?.toDate()).toLocaleDateString()}
                </div>
                <div className="flex gap-2 mt-2">
                  {interview.metadata.tags?.slice(0, 3).map((tag: string) => (
                    <span key={tag} className="px-2 py-1 text-xs bg-gray-100 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Most Popular Interviews */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Most Popular Interviews</h2>
        <div className="space-y-3">
          {stats?.mostPopular?.slice(0, 5).map((item: any, index: number) => (
            <div key={index} className="flex items-center border p-4 rounded-lg">
              <div className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full mr-4">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="font-medium">{item.role}</div>
                <div className="text-sm text-gray-500">
                  Used {item.uses} times
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Additions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Recently Cached</h2>
        <div className="space-y-3">
          {stats?.recentAdditions?.map((interview: any) => (
            <div key={interview.id} className="border p-4 rounded-lg">
              <div className="flex justify-between">
                <div>
                  <span className="font-medium">{interview.role}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    ({interview.level} • {interview.interviewType})
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(interview.metadata.createdAt?.toDate()).toLocaleDateString()}
                </div>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {interview.questions.length} questions •
                {interview.metadata.usageCount > 0
                  ? ` Used ${interview.metadata.usageCount} times`
                  : ' Not used yet'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={loadStats}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Refresh Stats
        </button>
        <button
          onClick={handleCleanup}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Cleanup Old Cache
        </button>
      </div>
    </div>
  );
}