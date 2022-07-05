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
import vtkSplineWidget from 'vtk.js/Sources/Widgets/Widgets3D/SplineWidget';

const classesToTest = [
  'vtkAngleWidget',
  'vtkDistanceWidget',
  'vtkEllipseWidget',
  'vtkImageCroppingWidget',
  'vtkLineWidget',
  'vtkPolyLineWidget',
  'vtkSplineWidget',
];

const WIDGET_CLASSES = {
  vtkAngleWidget: {
    class: vtkAngleWidget,
    numberOfHandles: 3,
    loseFocusMode: '',
  },
  vtkDistanceWidget: {
    class: vtkDistanceWidget,
    numberOfHandles: 2,
    loseFocusMode: '',
  },
  vtkEllipseWidget: {
    class: vtkEllipseWidget,
    numberOfHandles: 2,
    loseFocusMode: '',
  },
  vtkImageCroppingWidget: {
    class: vtkImageCroppingWidget,
    numberOfHandles: 0,
    loseFocusMode: '',
  },
  vtkLineWidget: {
    class: vtkLineWidget,
    numberOfHandles: 2,
    loseFocusMode: '',
  },
  vtkPolyLineWidget: {
    class: vtkPolyLineWidget,
    numberOfHandles: 5,
    loseFocusMode: 'Escape',
  },
  vtkSplineWidget: {
    class: vtkSplineWidget,
    numberOfHandles: 5,
    loseFocusMode: 'Enter',
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

function simulateKey(interactor, keyEvent) {
  interactor.handleKeyDown(
    new KeyboardEvent('keydown', {
      altKey: false,
      charCode: 0,
      shiftKey: false,
      ctrlKey: false,
      key: keyEvent,
    })
  );
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

// --------------------------------------------------------

classesToTest.forEach((testName) => {
  const classToTest =
    WIDGET_CLASSES[testName].class || WIDGET_CLASSES[testName];
  test(`Test ${testName} interactions`, async (t) => {
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
      const toTest = async () => {
        let [x, y] = renderWindow.getSize();
        x /= 2;
        y /= 2;

        for (let i = 0; i < WIDGET_CLASSES[testName].numberOfHandles; i++) {
          leftPress(interactor, x, y);
          leftRelease(interactor, x, y);

          y += 200 / WIDGET_CLASSES[testName].numberOfHandles;
          x += 100 / WIDGET_CLASSES[testName].numberOfHandles;
          // y = WIDGET_CLASSES[testName].points[i][1];
          // x = WIDGET_CLASSES[testName].points[i][0];
        }
        resolve();
      };
      toTest()
        .then(() => {
          t.ok(true, `Put ${WIDGET_CLASSES[testName].numberOfHandles} handles`);
        })
        .catch((err) => {
          t.fail(
            `Put ${WIDGET_CLASSES[testName].numberOfHandles} handles. Error : ${err}`
          );
        });
      return promise;
    }

    function pressKeyToLoseFocus() {
      let resolve;
      const promise = new Promise((res) => {
        resolve = res;
      });
      if (WIDGET_CLASSES[testName].loseFocusMode !== '') {
        t.doesNotThrow(() => {
          simulateKey(interactor, WIDGET_CLASSES[testName].loseFocusMode);
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
      const toTest = async () => {
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

    [
      placeHandles,
      pressKeyToLoseFocus,
      moveHandles,
      gc.releaseResources,
    ].reduce((current, next) => current.then(next), Promise.resolve());
  });
});
