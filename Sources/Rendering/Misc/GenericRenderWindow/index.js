import macro from 'vtk.js/Sources/macros';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkWebGPURenderWindow from 'vtk.js/Sources/Rendering/WebGPU/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkInteractorStyleTrackballCamera from 'vtk.js/Sources/Interaction/Style/InteractorStyleTrackballCamera';

// Load basic classes for vtk() factory
import 'vtk.js/Sources/Common/Core/Points';
import 'vtk.js/Sources/Common/Core/DataArray';
import 'vtk.js/Sources/Common/DataModel/PolyData';
import 'vtk.js/Sources/Rendering/Core/Actor';
import 'vtk.js/Sources/Rendering/Core/Mapper';

const DEFAULT_VIEW_API = navigator.gpu
  ? vtkWebGPURenderWindow
  : vtkOpenGLRenderWindow;

function vtkGenericRenderWindow(publicAPI, model) {
  // Capture resize trigger method to remove from publicAPI
  const invokeResize = publicAPI.invokeResize;
  delete publicAPI.invokeResize;

  // VTK renderWindow/renderer
  model.renderWindow = vtkRenderWindow.newInstance();
  model.renderer = vtkRenderer.newInstance();
  model.renderWindow.addRenderer(model.renderer);

  // API specific RenderWindow
  model.APISpecificRenderWindow = DEFAULT_VIEW_API.newInstance();
  model.renderWindow.addView(model.APISpecificRenderWindow);

  // Interactor
  model.interactor = vtkRenderWindowInteractor.newInstance();
  model.interactor.setInteractorStyle(
    vtkInteractorStyleTrackballCamera.newInstance()
  );
  model.interactor.setView(model.APISpecificRenderWindow);
  model.interactor.initialize();

  // Expose background
  publicAPI.setBackground = model.renderer.setBackground;

  // Update BG color
  publicAPI.setBackground(...model.background);

  // Handle window resize
  publicAPI.resize = () => {
    if (model.container) {
      const dims = model.container.getBoundingClientRect();
      const devicePixelRatio = window.devicePixelRatio || 1;
      model.APISpecificRenderWindow.setSize(
        Math.floor(dims.width * devicePixelRatio),
        Math.floor(dims.height * devicePixelRatio)
      );
      invokeResize();
      model.renderWindow.render();
    }
  };

  // Handle DOM container relocation
  publicAPI.setContainer = (el) => {
    if (model.container) {
      model.interactor.unbindEvents(model.container);
    }

    // Switch container
    model.container = el;
    model.APISpecificRenderWindow.setContainer(model.container);

    // Bind to new container
    if (model.container) {
      model.interactor.bindEvents(model.container);
    }
  };

  // Properly release GL context
  publicAPI.delete = macro.chain(
    publicAPI.setContainer,
    model.APISpecificRenderWindow.delete,
    publicAPI.delete
  );

  // Handle size
  if (model.listenWindowResize) {
    window.addEventListener('resize', publicAPI.resize);
  }
  publicAPI.resize();
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  background: [0.32, 0.34, 0.43],
  listenWindowResize: true,
  container: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, [
    'renderWindow',
    'renderer',
    'APISpecificRenderWindow',
    'interactor',
    'container',
  ]);
  macro.event(publicAPI, model, 'resize');

  // Object specific methods
  vtkGenericRenderWindow(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
