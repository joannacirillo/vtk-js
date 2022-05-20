import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkArrowSource from 'vtk.js/Sources/Filters/Sources/ArrowSource';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkOBBTree from 'vtk.js/Sources/Filters/General/OBBTree';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkOutlineFilter from 'vtk.js/Sources/Filters/General/OutlineFilter';

// const epsilon = 0.1;

const vals = [0, 0, 0];
const vecs = [
  [0, 0, 0],
  [0, 0, 0],
  [0, 0, 0],
];
const v = 1e-12;
vtkMath.jacobi(
  [
    [0.5, v, v],
    [v, 0.5, v],
    [v, v, 0.5],
  ],
  vals,
  vecs
);

console.log(vals);
console.log(vecs);

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

function render(mesh, userMatrix = null) {
  const mapper = vtkMapper.newInstance();
  mapper.setInputData(mesh);

  const actor = vtkActor.newInstance();
  actor.setMapper(mapper);

  renderer.addActor(actor);
  if (userMatrix) {
    actor.setUserMatrix(userMatrix);
  }

  return actor;
}

function addRepresentation(filter, props = {}) {
  const mapper = vtkMapper.newInstance();
  mapper.setInputConnection(filter.getOutputPort());

  const actor = vtkActor.newInstance();
  actor.setMapper(mapper);
  actor.getProperty().set(props);
  renderer.addActor(actor);
}

function addMesh(mesh, userMatrix) {
  const obbTree = vtkOBBTree.newInstance();

  const corner = [0, 0, 0];
  const max = [0, 0, 0];
  const mid = [0, 0, 0];
  const min = [0, 0, 0];
  const size = [0, 0, 0];

  obbTree.computeOBBFromDataset(mesh, corner, max, mid, min, size);
  console.log('corner', corner);
  console.log('max', max);
  console.log('mid', mid);
  console.log('min', min);
  console.log('size', size);

  obbTree.setDataset(mesh);
  obbTree.buildLocator();

  const obb = obbTree.generateRepresentation(0);
  const obbActor = render(obb, userMatrix);

  obbActor.getProperty().setOpacity(0);
  obbActor.getProperty().setEdgeVisibility(1);

  return obb;
}

const source = vtkArrowSource.newInstance({ direction: [1, 0, 0] });
source.setTipResolution(120);
source.update();

const obb = addMesh(source.getOutputData(), null);

const outline = vtkOutlineFilter.newInstance();
outline.setInputData(obb);
addRepresentation(outline, { lineWidth: 2 });

render(source.getOutputData(), null);

renderer.resetCamera();
renderer.resetCameraClippingRange();
renderWindow.render();
