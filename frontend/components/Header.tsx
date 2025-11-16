"use client";

import { useWeb3 } from '@/context/Web3Context';
import { Wallet, LogOut } from 'lucide-react';

export default function Header() {
  const { account, connectWallet, disconnectWallet, isConnecting } = useWeb3();

  return (
    <header className="bg-gradient-to-r from-army-green-800 via-army-green-700 to-army-green-600 text-white shadow-lg border-b-4 border-army-green-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">NFT Marketplace</h1>
          </div>

          <div>
            {account ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-white/70">Connected</p>
                  <p className="text-sm font-mono font-medium">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </p>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 bg-white/15 hover:bg-white/25"
                >
                  <LogOut className="w-4 h-4" />
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 bg-white text-army-green-800 hover:bg-army-green-50 disabled:bg-white/60 disabled:text-army-green-400 disabled:cursor-not-allowed"
              >
                <Wallet className="w-5 h-5" />
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
