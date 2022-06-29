/* eslint-disable no-await-in-loop */
import 'vtk.js/Sources/favicon';

import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';
import 'vtk.js/Sources/Rendering/Profiles/Glyph';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkWidgetManager from 'vtk.js/Sources/Widgets/Core/WidgetManager';
import vtkEllipseWidget from 'vtk.js/Sources/Widgets/Widgets3D/EllipseWidget';

// --- HELPERS METHODS ------------------------------------

async function leftPress(interactor, x, y) {
  interactor.handleMouseDown(
    new MouseEvent('mousedown', { clientX: x, clientY: y })
  );
}

async function leftRelease(interactor, x, y) {
  interactor.handleMouseUp(
    new MouseEvent('mouseup', { clientX: x, clientY: y })
  );
}

// --------------------------------------------------------

async function placeHandles(interactor, renderWindow) {
  let [x, y] = renderWindow.getSize();
  x /= 2;
  y /= 2;

  // Place first handle
  await leftPress(interactor, x, y);
  await leftRelease(interactor, x, y);

  x += 100;
  y += 100;
  // Place second handle
  await leftPress(interactor, x, y);
  await leftRelease(interactor, x, y);
}

test.only('Test Ellipse Widget', async (t) => {
  const gc = testUtils.createGarbageCollector(t);
  const fullScreenRenderer = gc.registerResource(
    vtkFullScreenRenderWindow.newInstance({
      background: [0, 0, 0],
    })
  );
  const renderer = gc.registerResource(fullScreenRenderer.getRenderer());
  const renderWindow = gc.registerResource(
    fullScreenRenderer.getApiSpecificRenderWindow()
  );

  const interactor = gc.registerResource(
    vtkRenderWindowInteractor.newInstance()
  );
  fullScreenRenderer.getRenderWindow().setInteractor(interactor);
  interactor.setView(renderWindow);
  interactor.initialize();

  const widgetManager = gc.registerResource(vtkWidgetManager.newInstance());
  widgetManager.setRenderer(renderer);

  const w = gc.registerResource(vtkEllipseWidget.newInstance());
  widgetManager.addWidget(w);
  widgetManager.grabFocus(w);

  renderWindow.render();
  widgetManager.enablePicking();
  renderer.resetCamera();

  t.doesNotThrow(async () => {
    await placeHandles(interactor, renderWindow);
  });
  gc.releaseResources();
});
