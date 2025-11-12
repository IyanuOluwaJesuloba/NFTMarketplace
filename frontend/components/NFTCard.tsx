"use client";

import { useState } from 'react';
import { ethers, Contract } from 'ethers';
import { useWeb3 } from '@/context/Web3Context';
import { MARKETPLACE_CONTRACT_ADDRESS, MARKETPLACE_ABI } from '@/config/contracts';
import toast from 'react-hot-toast';
import { ShoppingCart, X, DollarSign } from 'lucide-react';

interface NFTCardProps {
  listingId: number;
  seller: string;
  tokenId: number;
  priceInWei: bigint;
  priceInUSD: bigint;
  active: boolean;
  onUpdate?: () => void;
}

export default function NFTCard({
  listingId,
  seller,
  tokenId,
  priceInWei,
  priceInUSD,
  active,
  onUpdate,
}: NFTCardProps) {
  const { signer, account } = useWeb3();
  const [isProcessing, setIsProcessing] = useState(false);

  const priceETH = ethers.formatEther(priceInWei);
  const priceUSDFormatted = (Number(priceInUSD) / 1e8).toFixed(2);

  const handleBuy = async () => {
    if (!signer || !account) {
      toast.error('Please connect your wallet');
      return;
    }

    setIsProcessing(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const { wrapContractWithRedStone } = await import('@/lib/redstone');

      const marketplace = new ethers.Contract(
        MARKETPLACE_CONTRACT_ADDRESS,
        ['function buyNFT(uint256) payable'],
        signer
      );

      const wrappedMarketplace = await wrapContractWithRedStone(marketplace);

      toast.loading('Purchasing NFT...', { id: 'buy' });
      const tx = await wrappedMarketplace.buyNFT(listingId, {
        value: priceInWei,
      });
      await tx.wait();

      toast.success('NFT purchased successfully!', { id: 'buy' });
      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error('Purchase failed:', error);
      toast.error(error.message || 'Failed to purchase NFT', { id: 'buy' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!signer || !account) {
      toast.error('Please connect your wallet');
      return;
    }

    setIsProcessing(true);
    try {
      const marketplaceContract = new Contract(MARKETPLACE_CONTRACT_ADDRESS, MARKETPLACE_ABI, signer);
      
      toast.loading('Cancelling listing...', { id: 'cancel' });
      const tx = await marketplaceContract.cancelListing(listingId);
      await tx.wait();

      toast.success('Listing cancelled successfully!', { id: 'cancel' });
      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error('Cancellation failed:', error);
      toast.error(error.message || 'Failed to cancel listing', { id: 'cancel' });
    } finally {
      setIsProcessing(false);
    }
  };

  const isOwner = account?.toLowerCase() === seller.toLowerCase();

  if (!active) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      <div className="bg-gradient-to-br from-primary-500 to-primary-700 h-48 flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-sm opacity-80">Token ID</p>
          <p className="text-4xl font-bold">#{tokenId}</p>
        </div>
      </div>
      
      <div className="p-6">
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-1">Seller</p>
          <p className="text-sm font-mono truncate">{seller}</p>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
            <span className="text-sm text-gray-600">ETH Price</span>
            <span className="text-lg font-bold text-gray-900">{priceETH} ETH</span>
          </div>
          
          <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
            <span className="text-sm text-green-600 flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              USD Price
            </span>
            <span className="text-lg font-bold text-green-700">${priceUSDFormatted}</span>
          </div>
        </div>

        {isOwner ? (
          <button
            onClick={handleCancel}
            disabled={isProcessing}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" />
            {isProcessing ? 'Cancelling...' : 'Cancel Listing'}
          </button>
        ) : (
          <button
            onClick={handleBuy}
            disabled={isProcessing}
            className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" />
            {isProcessing ? 'Processing...' : 'Buy Now'}
          </button>
        )}
      </div>
    </div>
  );
}
