/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RPC_URL?: string
  readonly VITE_SN_SEPOLIA_RPC_URL?: string
  readonly VITE_SN_MAIN_RPC_URL?: string
  readonly VITE_DEFAULT_CHAIN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

