"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers, Contract } from 'ethers';
import {
  MARKETPLACE_CONTRACT_ADDRESS,
  MARKETPLACE_ABI,
  NFT_CONTRACT_ADDRESS,
  NFT_ABI,
  RPC_URL,
  CHAIN_ID,
} from '@/config/contracts';
import Header from '@/components/Header';
import MintNFT from '@/components/MintNFT';
import ListNFT from '@/components/ListNFT';
import NFTCard from '@/components/NFTCard';
import PriceOracle from '@/components/PriceOracle';
import { Store, RefreshCw, Image as ImageIcon, AlertTriangle, Loader2 } from 'lucide-react';

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const rawGateways = [
  process.env.NEXT_PUBLIC_IPFS_GATEWAY,
  'https://ipfs.io',
  'https://cloudflare-ipfs.com',
  'https://gateway.pinata.cloud',
  'https://dweb.link',
  'https://cf-ipfs.com',
];

const IPFS_GATEWAYS = Array.from(
  new Set(
    rawGateways
      .filter((gateway): gateway is string => typeof gateway === 'string' && gateway.trim().length > 0)
      .map((gateway) => stripTrailingSlash(gateway.trim()))
  )
);

const ensureGatewayPrefix = (gateway: string) => {
  const normalized = stripTrailingSlash(gateway);
  if (normalized.toLowerCase().endsWith('/ipfs')) {
    return normalized;
  }
  return `${normalized}/ipfs`;
};

const resolveIPFSGateways = (uri: string): string[] => {
  if (!uri) return [];

  if (uri.startsWith('ipfs://')) {
    const path = uri.replace('ipfs://', '').replace(/^ipfs\//i, '').replace(/^\/+/, '');
    return IPFS_GATEWAYS.map((gateway) => `${ensureGatewayPrefix(gateway)}/${path}`);
  }

  return [uri];
};

const resolveIPFSUri = (uri: string) => {
  const [primary] = resolveIPFSGateways(uri);
  return primary || '';
};

const fetchJSONFromGateways = async (uri: string) => {
  const urls = resolveIPFSGateways(uri);
  console.log(`Resolving IPFS URI "${uri}" to gateways:`, urls);
  
  if (urls.length === 0) {
    throw new Error('No gateway resolvers available for URI');
  }

  const errors: string[] = [];
  
  // Try direct fetch first
  for (const url of urls) {
    try {
      console.log(`Trying gateway: ${url}`);
      const response = await fetch(url, { 
        cache: 'no-store',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        }
      });
      if (!response.ok) {
        console.warn(`Gateway failed: ${url} (${response.status})`);
        errors.push(`${url} (${response.status})`);
        continue;
      }

      const contentType = response.headers.get('content-type') || '';
      const text = await response.text();
      
      // Check if it's an image or other non-JSON content
      if (contentType.includes('image/') || text.trim().startsWith('<svg') || text.trim().startsWith('<')) {
        console.log(`Content is not JSON (${contentType}), treating tokenURI as direct image`);
        // Return a synthetic metadata object for direct image URIs
        const syntheticData = {
          name: `NFT`,
          description: 'Direct image NFT',
          image: uri, // Use original URI as image
        };
        return { data: syntheticData, resolvedUrl: url } as const;
      }

      try {
        const data = JSON.parse(text);
        console.log(`Gateway success: ${url}`, data);
        return { data, resolvedUrl: url } as const;
      } catch (parseError) {
        console.warn(`JSON parse failed for ${url}:`, parseError);
        errors.push(`${url} (Invalid JSON)`);
        continue;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Gateway error: ${url} (${message})`);
      errors.push(`${url} (${message})`);
    }
  }

  // If all direct fetches fail due to CORS, try using a CORS proxy as fallback
  const corsProxy = 'https://api.allorigins.win/get?url=';
  for (const url of urls) {
    try {
      console.log(`Trying CORS proxy for: ${url}`);
      const proxyUrl = `${corsProxy}${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl, { cache: 'no-store' });
      
      if (!response.ok) {
        console.warn(`CORS proxy failed: ${url} (${response.status})`);
        errors.push(`proxy:${url} (${response.status})`);
        continue;
      }

      const proxyData = await response.json();
      if (proxyData.contents) {
        const text = proxyData.contents;
        
        // Check if it's an image or other non-JSON content
        if (text.trim().startsWith('<svg') || text.trim().startsWith('<')) {
          console.log(`Proxy content is not JSON, treating tokenURI as direct image`);
          const syntheticData = {
            name: `NFT`,
            description: 'Direct image NFT',
            image: uri,
          };
          return { data: syntheticData, resolvedUrl: url } as const;
        }

        try {
          const data = JSON.parse(text);
          console.log(`CORS proxy success: ${url}`, data);
          return { data, resolvedUrl: url } as const;
        } catch (parseError) {
          console.warn(`Proxy JSON parse failed for ${url}:`, parseError);
          errors.push(`proxy:${url} (Invalid JSON)`);
          continue;
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`CORS proxy error: ${url} (${message})`);
      errors.push(`proxy:${url} (${message})`);
    }
  }

  throw new Error(`All gateways and proxy failed: ${errors.join(', ')}`);
};

const formatNameWithTokenId = (name: string | undefined, tokenId: number) => {
  if (!name) return undefined;
  const cleanedName = name.replace(/\s*#\d+\s*$/, '').trimEnd();
  return `${cleanedName} #${tokenId}`;
};

interface ListingData {
  listingId: number;
  seller: string;
  nftContract: string;
  tokenId: number;
  priceInWei: bigint;
  priceInUSD: bigint;
  active: boolean;
}

type MetadataAttribute = {
  trait_type?: string;
  value?: string | number;
  display_type?: string;
};

interface TokenMetadata {
  name?: string;
  description?: string;
  image?: string;
  rawImage?: string;
  attributes?: MetadataAttribute[];
  metadataUrl?: string;
}

interface MintedNFT {
  tokenId: number;
  owner: string;
  tokenURI: string;
  metadata: TokenMetadata | null;
  metadataStatus: 'loading' | 'loaded' | 'error' | 'unavailable';
  metadataError?: string;
}

export default function Home() {
  const [listings, setListings] = useState<ListingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mintedNFTs, setMintedNFTs] = useState<MintedNFT[]>([]);
  const [mintedLoading, setMintedLoading] = useState(false);
  const [mintedRefreshing, setMintedRefreshing] = useState(false);
  const fetchingRef = useRef(false);

  const fetchListings = useCallback(async () => {
    if (!MARKETPLACE_CONTRACT_ADDRESS) {
      console.error('Marketplace contract address missing');
      setListings([]);
      setLoading(false);
      return;
    }

    if (refreshing) return;

    setRefreshing(true);
    try {
      // Create network without ENS support
      const network = ethers.Network.from({
        chainId: CHAIN_ID,
        name: 'lisk-sepolia',
      });
      const provider = new ethers.JsonRpcProvider(RPC_URL, network, {
        staticNetwork: network,
      });
      const marketplaceContract = new Contract(
        MARKETPLACE_CONTRACT_ADDRESS,
        MARKETPLACE_ABI,
        provider
      );

      const totalListings = await marketplaceContract.getTotalListings();
      const listingsData: ListingData[] = [];

      for (let i = 1; i <= Number(totalListings); i++) {
        try {
          const listing = await marketplaceContract.getListing(i);
          if (listing[5]) {
            listingsData.push({
              listingId: i,
              seller: listing[0],
              nftContract: listing[1],
              tokenId: Number(listing[2]),
              priceInWei: listing[3],
              priceInUSD: listing[4],
              active: listing[5],
            });
          }
        } catch (error) {
          console.error(`Failed to fetch listing ${i}:`, error);
        }
      }

      setListings(listingsData);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchMintedNFTs = useCallback(async () => {
    if (!NFT_CONTRACT_ADDRESS) {
      console.error('NFT contract address missing');
      setMintedNFTs([]);
      setMintedLoading(false);
      return;
    }

    if (fetchingRef.current) {
      console.log('Already fetching, skipping...');
      return;
    }

    console.log('Starting fetchMintedNFTs...');
    fetchingRef.current = true;
    setMintedRefreshing(true);
    setMintedLoading(true);

    try {
      // Create network without ENS support
      const network = ethers.Network.from({
        chainId: CHAIN_ID,
        name: 'lisk-sepolia',
      });
      const provider = new ethers.JsonRpcProvider(RPC_URL, network, {
        staticNetwork: network,
      });
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, provider);
      const currentTokenId = await nftContract.getCurrentTokenId();
      const totalMinted = Number(currentTokenId);

      if (totalMinted === 0) {
        setMintedNFTs([]);
        setMintedLoading(false);
        return;
      }

      const tokens: MintedNFT[] = [];

      // First, collect all token data without starting metadata fetches
      for (let tokenId = 1; tokenId <= totalMinted; tokenId++) {
        try {
          console.log(`Processing token ${tokenId}...`);
          const [owner, tokenURI] = await Promise.all([
            nftContract.ownerOf(tokenId),
            nftContract.tokenURI(tokenId),
          ]);

          console.log(`Token ${tokenId} - Owner: ${owner}, TokenURI: ${tokenURI}`);
          const metadataUrl = resolveIPFSUri(tokenURI);
          console.log(`Token ${tokenId} - Resolved metadata URL: ${metadataUrl}`);
          
          const tokenData: MintedNFT = {
            tokenId,
            owner,
            tokenURI,
            metadata: null,
            metadataStatus: metadataUrl ? 'loading' : 'unavailable',
          };

          tokens.push(tokenData);
        } catch (error) {
          tokens.push({
            tokenId,
            owner: 'Unavailable',
            tokenURI: '',
            metadata: null,
            metadataStatus: 'error',
            metadataError: 'Failed to fetch owner or token URI',
          });
        }
      }

      console.log(`Setting initial tokens state:`, tokens);
      setMintedNFTs(tokens);
      setMintedLoading(false);

      // Now start metadata fetches after state is set
      const metadataFetches: Promise<void>[] = [];
      
      for (const token of tokens) {
        if (token.metadataStatus === 'loading') {
          console.log(`Starting metadata fetch for token ${token.tokenId} from:`, token.tokenURI);
          const fetchPromise = fetchJSONFromGateways(token.tokenURI)
            .then(({ data, resolvedUrl }) => {
              console.log(`Metadata loaded for token ${token.tokenId}:`, data);
              const rawImage =
                typeof data.image === 'string'
                  ? data.image
                  : typeof data.image_url === 'string'
                    ? data.image_url
                    : undefined;
              const resolvedImage = rawImage ? resolveIPFSUri(rawImage) : undefined;
              console.log(`Image resolved for token ${token.tokenId}:`, { rawImage, resolvedImage });

              const metadata: TokenMetadata = {
                name: typeof data.name === 'string' ? data.name : undefined,
                description: typeof data.description === 'string' ? data.description : undefined,
                image: resolvedImage,
                rawImage,
                attributes: Array.isArray(data.attributes)
                  ? data.attributes.filter((attr: any) =>
                      attr &&
                      (typeof attr.trait_type === 'string' ||
                        typeof attr.value === 'string' ||
                        typeof attr.value === 'number')
                    )
                  : undefined,
                metadataUrl: resolvedUrl,
              };

              console.log(`Updating state for token ${token.tokenId} with metadata:`, metadata);
              setMintedNFTs((prev) => {
                console.log(`Current state before update for token ${token.tokenId}:`, prev);
                const tokenIndex = prev.findIndex(item => item.tokenId === token.tokenId);
                if (tokenIndex === -1) {
                  console.warn(`Token ${token.tokenId} not found in state!`);
                  return prev;
                }
                
                const updated = [...prev];
                updated[tokenIndex] = {
                  ...updated[tokenIndex],
                  metadata,
                  metadataStatus: 'loaded' as const,
                  metadataError: undefined,
                };
                console.log(`State updated for token ${token.tokenId}. Updated token:`, updated[tokenIndex]);
                console.log(`Full new state:`, updated);
                return updated;
              });
            })
            .catch((err: Error) => {
              console.error(`Failed to fetch metadata for token ${token.tokenId}:`, err);
              setMintedNFTs((prev) => {
                console.log(`Current state before error update for token ${token.tokenId}:`, prev);
                const tokenIndex = prev.findIndex(item => item.tokenId === token.tokenId);
                if (tokenIndex === -1) {
                  console.warn(`Token ${token.tokenId} not found in state for error update!`);
                  return prev;
                }
                
                const updated = [...prev];
                updated[tokenIndex] = {
                  ...updated[tokenIndex],
                  metadata: null,
                  metadataStatus: 'error' as const,
                  metadataError: err.message,
                };
                return updated;
              });
            });

          metadataFetches.push(fetchPromise);
        }
      }

      if (metadataFetches.length > 0) {
        console.log(`Waiting for ${metadataFetches.length} metadata fetches to complete...`);
        const results = await Promise.allSettled(metadataFetches);
        console.log(`Metadata fetches completed:`, results);
      }
    } catch (error) {
      console.error('Failed to fetch minted NFTs:', error);
      setMintedNFTs([]);
      setMintedLoading(false);
    } finally {
      setMintedRefreshing(false);
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchListings();
    fetchMintedNFTs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Oracle Price Feed */}
        <div className="mb-8">
          <PriceOracle />
        </div>

        {/* Mint and List Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <MintNFT onMintSuccess={() => {
            fetchMintedNFTs();
            fetchListings();
          }} />
          <ListNFT onListSuccess={fetchListings} />
        </div>

        {/* Minted NFTs */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <ImageIcon className="w-8 h-8" />
              Minted NFTs
            </h2>
            <button
              onClick={fetchMintedNFTs}
              disabled={mintedRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${mintedRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {mintedLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <p className="mt-4 text-gray-600">Loading minted NFTs...</p>
            </div>
          ) : mintedNFTs.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No NFTs minted yet</p>
              <p className="text-gray-500 text-sm mt-2">Mint an NFT to see it appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mintedNFTs.map((nft) => (
                <div key={nft.tokenId} className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="aspect-square bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                    {nft.metadataStatus === 'loaded' && nft.metadata?.image ? (
                      <img
                        src={nft.metadata.image}
                        alt={formatNameWithTokenId(nft.metadata?.name, nft.tokenId) || `NFT #${nft.tokenId}`}
                        className="w-full h-full object-cover"
                      />
                    ) : nft.metadataStatus === 'loading' ? (
                      <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                    ) : (
                      <ImageIcon className="w-10 h-10 text-gray-300" />
                    )}
                  </div>
                  <div className="mt-4 space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Token ID</p>
                      <p className="font-semibold">#{nft.tokenId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Owner</p>
                      <p className="font-mono text-xs break-all">{nft.owner}</p>
                    </div>
                    {nft.metadataStatus === 'loaded' && nft.metadata?.metadataUrl && (
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                          Metadata (Gateway)
                        </p>
                        <a
                          href={nft.metadata.metadataUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary-600 break-all hover:underline"
                        >
                          {nft.metadata.metadataUrl}
                        </a>
                      </div>
                    )}
                    {nft.metadataStatus === 'loaded' && nft.metadata?.image && (
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                          Image (Gateway)
                        </p>
                        <a
                          href={nft.metadata.image}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary-600 break-all hover:underline"
                        >
                          {nft.metadata.image}
                        </a>
                      </div>
                    )}
                    {nft.metadataStatus === 'loaded' && nft.metadata?.name && (
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="font-medium">
                          {formatNameWithTokenId(nft.metadata?.name, nft.tokenId)}
                        </p>
                      </div>
                    )}
                    {nft.metadataStatus === 'loaded' && nft.metadata?.description && (
                      <p className="text-sm text-gray-600">{nft.metadata.description}</p>
                    )}
                    {nft.metadataStatus === 'error' && (
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{nft.metadataError || 'Failed to load metadata'}</span>
                      </div>
                    )}
                    {nft.metadataStatus === 'unavailable' && (
                      <p className="text-sm text-gray-500">Metadata unavailable for this token.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Marketplace */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <Store className="w-8 h-8" />
              Marketplace
            </h2>
            <button
              onClick={fetchListings}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <p className="mt-4 text-gray-600">Loading listings...</p>
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12">
              <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No active listings yet</p>
              <p className="text-gray-500 text-sm mt-2">Mint and list your first NFT to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <NFTCard
                  key={listing.listingId}
                  listingId={listing.listingId}
                  seller={listing.seller}
                  tokenId={listing.tokenId}
                  priceInWei={listing.priceInWei}
                  priceInUSD={listing.priceInUSD}
                  active={listing.active}
                  onUpdate={fetchListings}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
