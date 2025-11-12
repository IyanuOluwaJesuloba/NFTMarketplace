"use client";

import { useState } from 'react';
import { ethers, Contract } from 'ethers';
import { useWeb3 } from '@/context/Web3Context';
import { NFT_CONTRACT_ADDRESS, MARKETPLACE_CONTRACT_ADDRESS, NFT_ABI, MARKETPLACE_ABI } from '@/config/contracts';
import toast from 'react-hot-toast';
import { Tag } from 'lucide-react';

export default function ListNFT({ onListSuccess }: { onListSuccess?: () => void }) {
  const { signer, account } = useWeb3();
  const [tokenId, setTokenId] = useState('');
  const [price, setPrice] = useState('');
  const [isListing, setIsListing] = useState(false);

  const handleList = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signer || !account) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!tokenId || !price) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsListing(true);
    try {
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, signer);
      const marketplaceContract = new Contract(MARKETPLACE_CONTRACT_ADDRESS, MARKETPLACE_ABI, signer);

      // Check if user owns the NFT
      const owner = await nftContract.ownerOf(tokenId);
      if (owner.toLowerCase() !== account.toLowerCase()) {
        toast.error('You do not own this NFT');
        setIsListing(false);
        return;
      }

      const handleListWithRedStone = async () => {
        if (!account || !NFT_CONTRACT_ADDRESS || !tokenId || !price) {
          toast.error('Please fill all fields');
          return;
        }

        try {
          setIsListing(true);
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();

          // Check if marketplace is approved
          const nftContract = new ethers.Contract(
            NFT_CONTRACT_ADDRESS,
            ['function getApproved(uint256) view returns (address)', 'function approve(address,uint256)'],
            signer
          );

          const approved = await nftContract.getApproved(tokenId);
          const marketplaceAddress = MARKETPLACE_CONTRACT_ADDRESS;

          if (approved.toLowerCase() !== marketplaceAddress.toLowerCase()) {
            toast.loading('Approving marketplace...');
            const approveTx = await nftContract.approve(marketplaceAddress, tokenId);
            await approveTx.wait();
            toast.success('Marketplace approved!');
          }

          // Use marketplace contract directly without RedStone for now
          console.log("Creating marketplace contract with address:", marketplaceAddress);
          console.log("Signer:", signer);
          
          const marketplace = new ethers.Contract(
            marketplaceAddress,
            MARKETPLACE_ABI,
            signer
          );

          console.log("Created marketplace contract:", marketplace);
          console.log("Marketplace contract address:", marketplace.target);

          toast.loading('Listing NFT...');
          const priceInWei = ethers.parseEther(price);
          
          // The current contract requires RedStone price data in calldata
          // For now, we'll provide a clear error message
          console.error("Contract requires RedStone price data in transaction calldata");
          throw new Error("Listing temporarily disabled: The marketplace contract requires price oracle data that is currently unavailable. Please try again later or contact support.");

          toast.success('NFT listed successfully!');
          setTokenId('');
          setPrice('');
        } catch (error: any) {
          console.error('Error listing NFT:', error);
          toast.error(error.message || 'Failed to list NFT');
        } finally {
          setIsListing(false);
        }
      };

      await handleListWithRedStone();
    } catch (error: any) {
      console.error('Listing failed:', error);
      toast.error(error.message || 'Failed to list NFT', { id: 'list' });
    } finally {
      setIsListing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Tag className="w-6 h-6" />
        List NFT for Sale
      </h2>
      <form onSubmit={handleList} className="space-y-4">
        <div>
          <label htmlFor="tokenId" className="block text-sm font-medium text-gray-700 mb-2">
            Token ID
          </label>
          <input
            type="number"
            id="tokenId"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            placeholder="1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={isListing}
          />
        </div>
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
            Price (ETH)
          </label>
          <input
            type="text"
            id="price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={isListing}
          />
        </div>
        <button
          type="submit"
          disabled={isListing || !account}
          className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isListing ? 'Listing...' : 'List NFT'}
        </button>
      </form>
    </div>
  );
}
