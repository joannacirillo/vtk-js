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

const ts = 100; // timestep

function sleep(ms) {
  // eslint-disable-next-line no-promise-executor-return
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// async function reset(representation, widgetManager, widget) {
//   await representation.reset();
//   await representation.updateRepresentationForRender();
//   await widgetManager.grabFocus(widget);
// }

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

async function mouseMove(interactor, x, y) {
  interactor.handleMouseMove(
    new MouseEvent('mousemove', { clientX: x, clientY: y })
  );
}

async function ctrlPress(interactor) {
  interactor.handleKeyDown(
    new KeyboardEvent('keydown', {
      ctrlKey: true,
      altKey: false,
      shiftKey: false,
      keyCode: 0,
      key: 'Control',
    })
  );
}

async function ctrlRelease(interactor) {
  interactor.handleKeyUp(
    new KeyboardEvent('keyup', {
      ctrlKey: true,
      altKey: false,
      shiftKey: false,
      keyCode: 0,
      key: 'Control',
    })
  );
}

async function shiftPress(interactor) {
  interactor.handleKeyDown(
    new KeyboardEvent('keydown', {
      altKey: false,
      charCode: 0,
      shiftKey: true,
      ctrlKey: false,
      key: 'Shift',
    })
  );
}

async function shiftRelease(interactor) {
  interactor.handleKeyUp(
    new KeyboardEvent('keyup', {
      altKey: false,
      charCode: 0,
      shiftKey: true,
      ctrlKey: false,
      key: 'Shift',
    })
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
  y -= 50;

  // Place second handle
  await leftPress(interactor, x, y);
  await leftRelease(interactor, x, y);
}

async function moveHandles(interactor, renderWindow) {
  let [x, y] = renderWindow.getSize();
  x /= 2;
  y /= 2;
  x += 100;
  y -= 50;

  // Select handle
  await leftPress(interactor, x, y);
  // Need to sleep here to let the time to updateSelection to end
  await sleep(ts);
  // Need to call a first mouseMove to trigger 'startMouseMove' before actually calling the actual mouseMove
  await mouseMove(interactor, x, y);
  x += 100;

  await mouseMove(interactor, x, y);

  // Release
  await leftRelease(interactor, x, y);
}

async function placeHandlesWithCtrl(interactor, renderWindow) {
  let [x, y] = renderWindow.getSize();
  x /= 2;
  y /= 2;

  // Place first handle
  await leftPress(interactor, x, y);
  await leftRelease(interactor, x, y);

  await ctrlPress(interactor);
  x += 100;
  y -= 50;

  // Place second handle
  await leftPress(interactor, x, y);
  await leftRelease(interactor, x, y);
  await ctrlRelease(interactor);
}

async function placeHandlesWithShift(interactor, renderWindow) {
  let [x, y] = renderWindow.getSize();
  x /= 2;
  y /= 2;

  // Place first handle
  await leftPress(interactor, x, y);
  await leftRelease(interactor, x, y);

  await shiftPress(interactor);
  x += 100;
  y -= 50;

  // Place second handle
  await leftPress(interactor, x, y);
  await leftRelease(interactor, x, y);
  await shiftRelease(interactor);

  // Wait that all mouse and keyboard events are done
  // await sleep(10000);
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
  const ellipseWidgetRepresentation = widgetManager.addWidget(w);
  widgetManager.grabFocus(w);
  ellipseWidgetRepresentation.updateRepresentationForRender();
  widgetManager.enablePicking();
  renderer.resetCamera();
  renderWindow.render();

  /******************* Test without key pressed and drag ********************** */
  t.doesNotThrow(async () => {
    await placeHandles(interactor, renderWindow);
  });
  renderer.resetCamera();
  // Wait that all mouse and keyboard events are done
  await sleep(200);
  t.doesNotThrow(async () => {
    await moveHandles(interactor, renderWindow);
  });
  // Wait that all mouse and keyboard events are done
  await sleep(200);
  widgetManager.grabFocus(w);
  /**************************************************************************** */

  /******************* Test with shift pressed  ******************************* */
  t.doesNotThrow(async () => {
    await placeHandlesWithShift(interactor, renderWindow);
  });
  renderer.resetCamera();
  // Wait that all mouse and keyboard events are done
  await sleep(200);
  widgetManager.grabFocus(w);
  /**************************************************************************** */

  /******************* Test with shift pressed  ******************************* */
  t.doesNotThrow(async () => {
    await placeHandlesWithCtrl(interactor, renderWindow);
  });
  renderer.resetCamera();
  /**************************************************************************** */

  // await renderWindow.render();
  // gc.releaseResources();
});
