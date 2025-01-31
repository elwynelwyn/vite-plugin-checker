import type { HMRPayload, ServerOptions, ConfigEnv } from 'vite'
import type { Worker } from 'worker_threads'

/* ----------------------------- userland plugin options ----------------------------- */

/** TypeScript checker configuration */
export type TscConfig =
  | boolean
  | Partial<{
      /** path to tsconfig.json file */
      tsconfigPath: string
      /** root path of cwd */
      root: string
    }>

/** vue-tsc checker configuration */
export type VueTscConfig =
  | boolean
  | Partial<{
      // TODO: support vue-tsc config
    }>

/** vls checker configuration */
export type VlsConfig =
  | boolean
  | Partial<{
      // TODO: support vls config
    }>

/** ESLint checker configuration */
export type EslintConfig =
  | false
  | {
      /** The lint target files. This can contain any of file paths, directory paths, and glob patterns. ([Details](https://eslint.org/docs/developer-guide/nodejs-api#parameters-1)). */
      files: string | string[]
      /**
       * Specify linted file extensions, 'extensions' must be an array of non-empty strings, e.g. `['.jsx', '.js']`. ([Details](https://eslint.org/docs/developer-guide/nodejs-api#parameters)).
       * @defaultValue: ['.js']
       */
      extensions?: string[]
      /**
       * millisecond for watcher to wait to trigger re-lint
       * @defaultValue: 300
       */
      // watchDelay?: number
      /**
       * Specify path to ESLint config file, if you wish to override ESLint's default configuration discovery.
       * Equivalent to ESLint's "--config" option.
       */
      configFile?: string
    }

/** checkers shared configuration */
export interface SharedConfig {
  /**
   * Enable checking in build mode
   * @defaultValue `true`
   */
  enableBuild: boolean
  /**
   * Show overlay when has TypeScript error
   * @defaultValue
   * Same as [Vite config](https://vitejs.dev/config/#root)
   */
  overlay: boolean
}

export interface BuildInCheckers {
  typescript: TscConfig
  vueTsc: VueTscConfig
  vls: VlsConfig
  eslint: EslintConfig
}

export type BuildInCheckerNames = keyof BuildInCheckers

export type PluginConfig = SharedConfig & BuildInCheckers

/** Userland plugin configuration */
export type UserPluginConfig = Partial<PluginConfig>

/* ----------------------------- worker actions ----------------------------- */

export enum ACTION_TYPES {
  config = 'config',
  configureServer = 'configureServer',
  overlayError = 'overlayError',
  unref = 'unref',
}

interface Action {
  type: string
  payload: unknown
}

export interface OverlayErrorAction extends Action {
  type: ACTION_TYPES.overlayError
  payload: HMRPayload
}

export interface ConfigAction extends Action {
  type: ACTION_TYPES.config
  payload: Pick<ServerOptions, 'hmr'> & { env: ConfigEnv }
}

export interface ConfigureServerAction extends Action {
  type: ACTION_TYPES.configureServer
  payload: {
    root: string
  }
}

export interface UnrefAction extends Action {
  type: ACTION_TYPES.unref
}

export type Actions = OverlayErrorAction | ConfigAction | ConfigureServerAction | UnrefAction

/* ----------------------------- internal types ----------------------------- */

// prepare for create serve & build checker

export type BuildCheckBin = BuildCheckBinStr | BuildCheckBinFn
export type BuildCheckBinStr = [string, ReadonlyArray<string>]
export type BuildCheckBinFn = (config: UserPluginConfig) => [string, ReadonlyArray<string>]

export interface ConfigureServeChecker {
  worker: Worker
  config: (config: ConfigAction['payload']) => void
  configureServer: (serverConfig: ConfigureServerAction['payload']) => void
}

export interface ServeAndBuildChecker {
  serve: ConfigureServeChecker
  build: { buildBin: BuildCheckBin; buildFile?: string }
}

/**
 * create serve & build checker
 */

export interface ServeChecker<T extends BuildInCheckerNames = any> {
  createDiagnostic: CreateDiagnostic<T>
}

export interface CheckerDiagnostic {
  config: (options: Pick<ServerOptions, 'hmr'> & { env: ConfigEnv }) => unknown
  configureServer: (options: { root: string }) => unknown
}

export type CreateDiagnostic<T extends BuildInCheckerNames = any> = (
  config: Pick<BuildInCheckers, T> & SharedConfig
) => CheckerDiagnostic
