import { Chain } from "viem";

export type NetworkConfig = {
  chain: Chain;
  rpcUrl: string;
  network: string;
  explorerUrl: string;
};