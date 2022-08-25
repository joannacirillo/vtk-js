import macro from 'vtk.js/macros';
import vtkImageReslice from 'vtk.js/Sources/Imaging/Core/ImageReslice';

// ----------------------------------------------------------------------------
// vtkWebGPUImageReslice methods
// ----------------------------------------------------------------------------

function vtkWebGPUImageReslice(publicAPI, model) {
  model.classHierarchy.push('vtkWebGPUImageReslice');
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkImageReslice.extend(publicAPI, model, initialValues);

  vtkWebGPUImageReslice(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWebGPUImageReslice');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
