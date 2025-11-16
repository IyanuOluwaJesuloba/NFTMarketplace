"use client";

import { useState } from 'react';
import { ethers, Contract } from 'ethers';
import { useWeb3 } from '@/context/Web3Context';
import { NFT_CONTRACT_ADDRESS, NFT_ABI } from '@/config/contracts';
import toast from 'react-hot-toast';
import { Upload } from 'lucide-react';

export default function MintNFT({ onMintSuccess }: { onMintSuccess?: () => void }) {
  const { signer, account } = useWeb3();
  const [tokenURI, setTokenURI] = useState('');
  const [isMinting, setIsMinting] = useState(false);

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signer || !account) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!tokenURI) {
      toast.error('Please enter a token URI');
      return;
    }

    setIsMinting(true);
    try {
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, signer);
      const tx = await nftContract.mint(tokenURI);
      
      toast.loading('Minting NFT...', { id: 'mint' });
      const receipt = await tx.wait();
      
      // Get the token ID from the Transfer event
      const transferEvent = receipt.logs.find((log: any) => {
        try {
          const parsed = nftContract.interface.parseLog(log);
          return parsed?.name === 'Transfer';
        } catch {
          return false;
        }
      });

      toast.success('NFT minted successfully!', { id: 'mint' });
      setTokenURI('');
      
      if (onMintSuccess) onMintSuccess();
    } catch (error: any) {
      console.error('Minting failed:', error);
      toast.error(error.message || 'Failed to mint NFT', { id: 'mint' });
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-army-green-600">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-army-green-900">
        <Upload className="w-6 h-6 text-army-green-700" />
        Mint New NFT
      </h2>
      <form onSubmit={handleMint} className="space-y-4">
        <div>
          <label htmlFor="tokenURI" className="block text-sm font-medium text-army-green-700 mb-2">
            Token URI (IPFS or metadata URL)
          </label>
          <input
            type="text"
            id="tokenURI"
            value={tokenURI}
            onChange={(e) => setTokenURI(e.target.value)}
            placeholder="ipfs://..."
            className="w-full px-4 py-2 border-2 border-army-green-200 rounded-lg focus:ring-2 focus:ring-army-green-500 focus:border-transparent"
            disabled={isMinting}
          />
          <p className="mt-1 text-sm text-army-green-600">
            Upload your NFT metadata to IPFS and paste the URI here
          </p>
        </div>
        <button
          type="submit"
          disabled={isMinting || !account}
          className="w-full bg-army-green-700 text-white py-3 px-4 rounded-lg font-medium hover:bg-army-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isMinting ? 'Minting...' : 'Mint NFT'}
        </button>
      </form>
    </div>
  );
}
