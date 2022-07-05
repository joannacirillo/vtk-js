import 'vtk.js/Sources/favicon';

import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';
import 'vtk.js/Sources/Rendering/Profiles/Glyph';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkWidgetManager from 'vtk.js/Sources/Widgets/Core/WidgetManager';
import vtkDistanceWidget from 'vtk.js/Sources/Widgets/Widgets3D/DistanceWidget';
import vtkEllipseWidget from 'vtk.js/Sources/Widgets/Widgets3D/EllipseWidget';
import vtkPolyLineWidget from 'vtk.js/Sources/Widgets/Widgets3D/PolyLineWidget';

const classesToTest = [
  // 'vtkDistanceWidget',
  // 'vtkEllipseWidget',
  'vtkPolyLineWidget',
];

const SERIALIZABLE_CLASSES = {
  vtkDistanceWidget: {
    class: vtkDistanceWidget,
    numberOfHandles: 2,
  },
  vtkEllipseWidget: {
    class: vtkEllipseWidget,
    numberOfHandles: 2,
  },
  vtkPolyLineWidget: {
    class: vtkPolyLineWidget,
    numberOfHandles: 5,
  },
};

// --- HELPERS METHODS ------------------------------------
const ts = 100; // timestep

function sleep(ms) {
  // eslint-disable-next-line no-promise-executor-return
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function leftPress(interactor, x, y) {
  interactor.handleMouseDown(
    new MouseEvent('mousedown', { clientX: x, clientY: y })
  );
}

function leftRelease(interactor, x, y) {
  interactor.handleMouseUp(
    new MouseEvent('mouseup', { clientX: x, clientY: y })
  );
}

function mouseMove(interactor, x, y) {
  interactor.handleMouseMove(
    new MouseEvent('mousemove', { clientX: x, clientY: y })
  );
}
// --------------------------------------------------------

classesToTest.forEach((testName) => {
  const classToTest =
    SERIALIZABLE_CLASSES[testName].class || SERIALIZABLE_CLASSES[testName];
  test.only(`Test ${testName} interactions`, async (t) => {
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

    const w = gc.registerResource(classToTest.newInstance());
    widgetManager.addWidget(w);
    widgetManager.grabFocus(w);

    renderWindow.render();
    widgetManager.enablePicking();
    renderer.resetCamera();

    function placeHandles() {
      let resolve;
      const promise = new Promise((res) => {
        resolve = res;
      });
      t.doesNotThrow(() => {
        let [x, y] = renderWindow.getSize();
        x /= 2;
        y /= 2;

        // Place first handle
        leftPress(interactor, x, y);
        leftRelease(interactor, x, y);

        y += 100;
        x += 50;
        // Place second handle
        leftPress(interactor, x, y);
        leftRelease(interactor, x, y);
        resolve();
      });
      return promise;
    }

    async function moveHandles() {
      let resolve;
      const promise = new Promise((res) => {
        resolve = res;
      });
      const toTest = async () => {
        let [x, y] = renderWindow.getSize();
        x /= 2;
        y /= 2;
        y += 100;
        x += 50;

        // Select handle
        leftPress(interactor, x, y);
        // Need to sleep here to let the time to updateSelection to end
        await sleep(ts);
        // Need to call a first mouseMove to trigger 'startMouseMove' before calling the actual mouseMove
        mouseMove(interactor, x, y);
        x += 100;

        mouseMove(interactor, x, y);

        // Release
        leftRelease(interactor, x, y);
        resolve();
      };
      toTest()
        .then(() => {
          t.ok(true, 'Does not throw while moving handles');
        })
        .catch((err) => {
          t.fail(`${err}`);
        });
      return promise;
    }

    [placeHandles, moveHandles, gc.releaseResources].reduce(
      (current, next) => current.then(next),
      Promise.resolve()
    );
  });
});
