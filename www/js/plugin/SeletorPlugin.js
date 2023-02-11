class SeletorPlugin {

    modalPlugin = null;
    modal = null;

    constructor(modalPlugin) {
        this.modalPlugin = modalPlugin;
    }

    abrir = async function() {
        var modal = await modalPlugin.fromTemplateUrl('filtro.html', {
            scope: $scope,
            animation: 'slide-in-up'
        });

        this.modal = modal;
        this.modal.show();
    }

    fechar = function() {
        this.modal.remove();
    }
}