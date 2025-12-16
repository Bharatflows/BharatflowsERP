import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import POSSessionManager from './POSSessionManager';
import POSTerminal from './POSTerminal';

export const POSModule = () => {
    return (
        <Routes>
            <Route path="session" element={<POSSessionManager />} />
            <Route path="terminal" element={<POSTerminal />} />
            <Route path="/" element={<Navigate to="session" replace />} />
        </Routes>
    );
};
