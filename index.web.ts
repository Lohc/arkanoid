import { registerRootComponent } from 'expo';
import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

// En web, Skia necesita CanvasKit (public/canvaskit.wasm) cargado antes de importar
// cualquier componente que lo use; por eso App se importa después.
LoadSkiaWeb({ locateFile: (file) => `/${file}` }).then(async () => {
  const { default: App } = await import('./App');
  registerRootComponent(App);
});
