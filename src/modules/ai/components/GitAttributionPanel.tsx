"use client";

import React from 'react';
import { useHarnessGitAttribution } from '@/modules/dev/hooks/useHarnessGitAttribution';
import { useHarnessWorkspace } from '@/modules/dev/hooks/useHarnessWorkspace';

export function GitAttributionPanel() {
  const { currentWorkspace } = useHarnessWorkspace();
  const { policy, gitUser, loading, error, refreshInfo } = useHarnessGitAttribution(
    (currentWorkspace as any)?.uri
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Git Attribution
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Commit attribution policies and active git user info.
          </p>
        </div>
        <button
          onClick={refreshInfo}
          disabled={loading}
          className="px-3 py-1.5 text-sm font-medium rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm border border-red-200 dark:border-red-900/50">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Agent Attribution Policy</h3>
            </div>
            <div className="p-4">
              {loading && !policy ? (
                <div className="text-sm text-gray-500 animate-pulse">Loading policy...</div>
              ) : policy ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Co-Authored-By:</span>
                    <span className="col-span-2 font-mono">{policy.co_authored_by ? 'Enabled' : 'Disabled'}</span>
                    
                    <span className="text-gray-500 dark:text-gray-400">Include Human:</span>
                    <span className="col-span-2 font-mono">{policy.include_human ? 'Enabled' : 'Disabled'}</span>

                    <span className="text-gray-500 dark:text-gray-400">Agent Name:</span>
                    <span className="col-span-2 font-medium">{policy.agent_name}</span>

                    <span className="text-gray-500 dark:text-gray-400">Agent Email:</span>
                    <span className="col-span-2 font-medium text-blue-600 dark:text-blue-400">{policy.agent_email}</span>

                    <span className="text-gray-500 dark:text-gray-400">Trailer Format:</span>
                    <span className="col-span-2 font-mono text-xs p-1 bg-gray-100 dark:bg-gray-800 rounded">
                      {policy.trailer_format}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">No policy available</div>
              )}
            </div>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Human Co-Author (Git Config)</h3>
            </div>
            <div className="p-4">
              {loading && !gitUser ? (
                <div className="text-sm text-gray-500 animate-pulse">Loading git user...</div>
              ) : gitUser ? (
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-500 dark:text-gray-400">Name:</span>
                    <span className="col-span-2 font-medium">{gitUser.name || <span className="text-gray-400 italic">Not set</span>}</span>

                    <span className="text-gray-500 dark:text-gray-400">Email:</span>
                    <span className="col-span-2 font-medium text-blue-600 dark:text-blue-400">{gitUser.email || <span className="text-gray-400 italic">Not set</span>}</span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">No git user info available</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
