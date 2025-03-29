import { useState, useEffect } from 'react';
import { db } from '../utils/database';

const DatabaseStatus: React.FC = () => {
    const [status, setStatus] = useState<{
        pending: number;
        isSyncing: boolean;
        lastSync: number;
        error: string | undefined;
        isOnline: boolean;
    }>({
        pending: 0,
        isSyncing: false,
        lastSync: 0,
        error: undefined,
        isOnline: true
    });

    useEffect(() => {
        // Update status initially and every 2 seconds
        updateStatus();
        const interval = setInterval(updateStatus, 2000);

        return () => clearInterval(interval);
    }, []);

    const updateStatus = () => {
        const currentStatus = db.getSyncStatus();
        setStatus(currentStatus);
    };

    const formatTime = (timestamp: number) => {
        if (!timestamp) return 'Never';

        const date = new Date(timestamp);
        return date.toLocaleTimeString();
    };

    const handleForceSyncClick = async () => {
        await db.forceSyncWithRemote();
        updateStatus();
    };

    return (
        <div className="bg-gray-100 p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-2">Database Status</h2>

            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span>Connection:</span>
                    <span className={status.isOnline ? 'text-green-600' : 'text-red-600'}>
                        {status.isOnline ? 'Online' : 'Offline'}
                    </span>
                </div>

                <div className="flex justify-between">
                    <span>Pending Changes:</span>
                    <span>{status.pending}</span>
                </div>

                <div className="flex justify-between">
                    <span>Syncing:</span>
                    <span>{status.isSyncing ? 'Yes' : 'No'}</span>
                </div>

                <div className="flex justify-between">
                    <span>Last Sync:</span>
                    <span>{formatTime(status.lastSync)}</span>
                </div>

                {status.error && (
                    <div className="flex justify-between text-red-500">
                        <span>Error:</span>
                        <span>{status.error}</span>
                    </div>
                )}
            </div>

            <button
                onClick={handleForceSyncClick}
                disabled={!status.isOnline || status.isSyncing}
                className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
                Force Sync
            </button>
        </div>
    );
};

export default DatabaseStatus;