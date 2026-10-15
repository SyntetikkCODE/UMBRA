Sources natives du hook : https://github.com/SnosMe/uiohook-napi/tree/44e0d868ac6fedd2a68c7f8ad8163c73a3f36fc3
Bibliothèque LGPL : https://github.com/kwhat/libuiohook/tree/f259ff37e81125f6f91ebac5439e7cde1e78b296

Pour reconstruire : extraire les sources du wrapper, placer les sources libuiohook dans son sous-dossier libuiohook, installer les outils C++ Windows/Node-gyp, puis npm install et npx node-gyp rebuild. Le fichier .node peut être remplacé dans resources/app.asar.unpacked/node_modules/uiohook-napi/prebuilds/win32-x64.
