import { defineConfig } from 'rollup';
import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';

export default defineConfig([
    {
        input: 'src/index.ts',
        output: [
            {
                file: 'dist/index.cjs',
                format: 'cjs'
            },
            {
                file: 'dist/index.mjs',
                format: 'es'
            }
        ],
        plugins: [esbuild({ tsconfig: 'tsconfig.lib.json' })]
    },
    {
        input: './compiled/types/index.d.ts',
        output: [{ file: 'dist/index.d.ts', format: 'es' }],
        plugins: [dts({ tsconfig: 'tsconfig.lib.json' })]
    }
]);
