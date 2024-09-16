/* global AFRAME NAF */

// Temporary workaround for template declaration; see issue 167
NAF.schemas.getComponentsOriginal = NAF.schemas.getComponents;
NAF.schemas.getComponents = (template) => {
  if (!NAF.schemas.hasTemplate('#avatar-template')) {
    NAF.schemas.add({
      template: '#avatar-template',
      components: [
        {
          component: 'position',
          requiresNetworkUpdate: NAF.utils.vectorRequiresUpdate(0.001),
        },
        {
          component: 'rotation',
          requiresNetworkUpdate: NAF.utils.vectorRequiresUpdate(0.5),
        },
        {
          selector: '.avatar-model',
          component: 'visible',
        },
        {
          selector: '#camera-display',
          component: 'visible',
        },
        'player-info',
      ],
    });
  }

  if (!NAF.schemas.hasTemplate('#screenshare-template')) {
    NAF.schemas.add({
      template: '#screenshare-template',
      components: [
        {
          component: 'position',
          requiresNetworkUpdate: NAF.utils.vectorRequiresUpdate(0.001),
        },
        {
          component: 'rotation',
          requiresNetworkUpdate: NAF.utils.vectorRequiresUpdate(0.5),
        },
        'player-info',
      ],
    });
  }

  const components = NAF.schemas.getComponentsOriginal(template);
  return components;
};

AFRAME.registerComponent('player-info', {
  schema: {
    name: { type: 'string', default: 'anonymous' },
    color: { type: 'color', default: '#ffffff' },
    muted: { type: 'boolean', default: false },
    videoOff: { type: 'boolean', default: false },
    screenShareOff: { type: 'boolean', default: false },
  },

  init: function () {
    this.avatarModel = this.el.querySelector('.avatar-model');
    this.nametag = this.el.querySelector('.nametag');
    this.updatedEventDetail = { el: undefined, data: undefined, oldData: undefined };
  },

  update: function (oldData) {
    this.updatedEventDetail.data = this.data;
    this.updatedEventDetail.oldData = oldData;
    this.updatedEventDetail.el = this.el;
    this.el.sceneEl.emit('player-info-updated', this.updatedEventDetail);
    this.updatedEventDetail.data = undefined;
    this.updatedEventDetail.oldData = undefined;
    this.updatedEventDetail.el = undefined;
    if (this.avatarModel) this.avatarModel.setAttribute('material', 'color', this.data.color);
    if (this.nametag) this.nametag.setAttribute('value', this.data.name);
  },
});
