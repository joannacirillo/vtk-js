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

import vtkAngleWidget from 'vtk.js/Sources/Widgets/Widgets3D/AngleWidget';
import vtkDistanceWidget from 'vtk.js/Sources/Widgets/Widgets3D/DistanceWidget';
import vtkEllipseWidget from 'vtk.js/Sources/Widgets/Widgets3D/EllipseWidget';
import vtkImageCroppingWidget from 'vtk.js/Sources/Widgets/Widgets3D/ImageCroppingWidget';
import vtkLineWidget from 'vtk.js/Sources/Widgets/Widgets3D/LineWidget';

import vtkPolyLineWidget from 'vtk.js/Sources/Widgets/Widgets3D/PolyLineWidget';
import vtkRectangleWidget from 'vtk.js/Sources/Widgets/Widgets3D/RectangleWidget';

import vtkSplineWidget from 'vtk.js/Sources/Widgets/Widgets3D/SplineWidget';

const classesToTest = [
  'vtkAngleWidget',
  'vtkDistanceWidget',
  'vtkEllipseWidget',
  'vtkImageCroppingWidget',
  'vtkLineWidget',
  'vtkPolyLineWidget',
  'vtkRectangleWidget',
  'vtkSplineWidget',
];

const WIDGET_CLASSES = {
  vtkAngleWidget: {
    class: vtkAngleWidget,
    numberOfHandles: 3,
  },
  vtkDistanceWidget: {
    class: vtkDistanceWidget,
    numberOfHandles: 2,
  },
  vtkEllipseWidget: {
    class: vtkEllipseWidget,
    numberOfHandles: 2,
    keysToTest: ['Shift', 'Control'],
  },
  vtkImageCroppingWidget: {
    class: vtkImageCroppingWidget,
    numberOfHandles: 0,
  },
  vtkLineWidget: {
    class: vtkLineWidget,
    numberOfHandles: 2,
  },
  vtkPolyLineWidget: {
    class: vtkPolyLineWidget,
    numberOfHandles: 5,
    loseFocusMode: 'Escape',
  },
  vtkRectangleWidget: {
    class: vtkRectangleWidget,
    numberOfHandles: 2,
  },
  vtkSplineWidget: {
    class: vtkSplineWidget,
    numberOfHandles: 5,
    loseFocusMode: 'Enter',
  },
};

// --- HELPERS METHODS FOR EVENTS ---------------------------------
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

function keyPress(interactor, keyEvent) {
  interactor.handleKeyDown(
    new KeyboardEvent('keydown', {
      altKey: false,
      charCode: 0,
      shiftKey: false,
      ctrlKey: false,
      key: keyEvent,
    })
  );
}

function keyUp(interactor, keyEvent) {
  interactor.handleKeyUp(
    new KeyboardEvent('keyup', {
      altKey: false,
      charCode: 0,
      shiftKey: false,
      ctrlKey: false,
      key: keyEvent,
    })
  );
}

// ----------------------------------------------------------
// --- TEST HELPERS -----------------------------------------
function testAsyncFunction(func, t, successMsg) {
  func()
    .then(() => t.ok(true, successMsg))
    .catch((err) => t.fail(`${err}`));
}
// ----------------------------------------------------------

classesToTest.forEach((testName) => {
  const classToTest =
    WIDGET_CLASSES[testName].class || WIDGET_CLASSES[testName];
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
      testAsyncFunction(
        async () => {
          let [x, y] = renderWindow.getSize();
          x /= 2;
          y /= 2;

          // Some widget need mouseMove to be triggerer to set origin of handle
          mouseMove(interactor, x, y);
          mouseMove(interactor, x, y);
          for (let i = 0; i < WIDGET_CLASSES[testName].numberOfHandles; i++) {
            leftPress(interactor, x, y);
            leftRelease(interactor, x, y);

            y += 200 / WIDGET_CLASSES[testName].numberOfHandles;
            x += 100 / WIDGET_CLASSES[testName].numberOfHandles;

            // Some widget need mouseMove to be triggerer to set origin of handle
            mouseMove(interactor, x, y);
            mouseMove(interactor, x, y);
          }
          resolve();
        },
        t,
        `Put ${WIDGET_CLASSES[testName].numberOfHandles} handles.`
      );
      return promise;
    }

    function pressKeyToLoseFocus() {
      let resolve;
      const promise = new Promise((res) => {
        resolve = res;
      });
      if (WIDGET_CLASSES[testName].loseFocusMode) {
        t.doesNotThrow(() => {
          keyPress(interactor, WIDGET_CLASSES[testName].loseFocusMode);
          keyUp(interactor, WIDGET_CLASSES[testName].loseFocusMode);
        }, `Press ${WIDGET_CLASSES[testName].loseFocusMode} key to lose focus`);
      }
      resolve();
      return promise;
    }

    async function moveHandles() {
      let resolve;
      const promise = new Promise((res) => {
        resolve = res;
      });
      testAsyncFunction(
        async () => {
          let [x, y] = renderWindow.getSize();
          x /= 2;
          y /= 2;
          y += 200 / WIDGET_CLASSES[testName].numberOfHandles;
          x += 100 / WIDGET_CLASSES[testName].numberOfHandles;

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
        },
        t,
        'Move an handle'
      );
      return promise;
    }

    function testKeyPress() {
      widgetManager.grabFocus(w);
      WIDGET_CLASSES[testName].keysToTest?.forEach((keyName) => {
        let resolve;
        const promise = new Promise((res) => {
          resolve = res;
        });
        testAsyncFunction(
          async () => {
            let [x, y] = renderWindow.getSize();
            x /= 2;
            y /= 2;

            leftPress(interactor, x, y);
            leftRelease(interactor, x, y);

            keyPress(interactor, keyName);
            x += 100;
            y -= 50;

            leftPress(interactor, x, y);
            leftRelease(interactor, x, y);
            keyUp(interactor);
            resolve();
          },
          t,
          `Place handles with key pressed: ${keyName}`
        );
        return promise;
      });
    }

    [
      placeHandles,
      pressKeyToLoseFocus,
      moveHandles,
      testKeyPress,
      gc.releaseResources,
    ].reduce((current, next) => current.then(next), Promise.resolve());
  });
});
