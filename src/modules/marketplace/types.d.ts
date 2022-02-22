import { ArweaveFile } from '@/modules/arweave/types';

export interface MarketplaceMetaData {
  name: string;
  description: string;
}

export interface MarketplaceTheme<F = ArweaveFile> {
  logo: F;
  banner: F;
}

export interface MarketplaceAddress {
  auctionHouse: string;
  owner: string;
}

export interface Marketplace<F = ArweaveFile> {
  address: MarketplaceAddress;
  subdomain: string;
  meta: MarketplaceMetaData;
  theme: MarketplaceTheme;
}