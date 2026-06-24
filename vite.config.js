import glsl from 'vite-plugin-glsl'

export default {
    plugins:
    [
        glsl() 
    ],
    resolve: {
        alias: {
            'three/addons': 'three/examples/jsm'
        }
    }
}