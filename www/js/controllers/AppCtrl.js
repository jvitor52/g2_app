app.controller('AppCtrl', function ($scope, $rootScope, $ionicModal, $ionicPopover, $timeout, $ionicPlatform, $state) {
    // Form data for the login modal
    $scope.loginData = {};
    ///////////////

    $scope.versao = '0.0.21';

    /////////
    var navIcons = document.getElementsByClassName('ion-navicon');
    for (var i = 0; i < navIcons.length; i++) {

        //            navIcons.addEventListener('click', function () {
        //                this.classList.toggle('active');
        //            });
    }




    // .fromTemplate() method
    var template = '<ion-popover-view>' +
        '   <ion-header-bar>' +
        '       <h1 class="title">Opções de Navegação</h1>' +
        '   </ion-header-bar>' +
        '   <ion-content class="padding">' +
        '       Criar nova tarefa' +
        '   </ion-content>' +
        '</ion-popover-view>';
    $scope.popover = $ionicPopover.fromTemplate(template, {
        scope: $scope
    });
    $scope.closePopover = function () {
        $scope.popover.hide();
    };
    //Cleanup the popover when we're done with it!
    $scope.$on('$destroy', function () {
        $scope.popover.remove();
    });

    $scope.close = function () {
        ionic.Platform.exitApp()
        window.close();
    }

    $scope.voltar = function () {

        if ($rootScope.historico && $rootScope.historico.name && $rootScope.historico.funcao && $rootScope.historico.scope) {
            $rootScope.historico.scope[$rootScope.historico.funcao]();
            return;
        }

        var rota = null;
        switch ($state.current.name) {
            case 'app.bf':
            case 'app.colheita':
                rota = 'app.components';
                break;
            case 'app.operacaoDiaria':
                rota = 'app.bf';
                break;
            case 'app.editarOperacaoDiaria':
                rota = 'app.operacaoDiaria';
                break;
            case 'app.operacaoDiariaFilho':
                rota = 'app.operacaoDiaria';
                break;
            case 'app.colheitaLista':
                rota = 'app.colheita';
                break;
            case 'app.colheitaFilho':
                rota = 'app.colheitaLista';
                break;
            case 'app.abastecimento':
                rota = 'app.ab';
                break;
            case 'app.abastecimentoEditar':
                rota = 'app.abastecimento';
                break;
            case 'app.materialAbastecimentoEditar':
                rota = 'app.abastecimentoEditar';
                break;
            case 'app.aferimento':
                rota = 'app.ab';
                break;
            case 'app.aferimentoEditar':
                rota = 'app.aferimento';
                break;
            case 'app.medicao':
                rota = 'app.ab';
                break;
            case 'app.medicaoEditar':
                rota = 'app.medicao';
                break;
            case 'app.encerrante':
                rota = 'app.ab';
                break;
            case 'app.encerranteEditar':
                rota = 'app.encerrante';
                break;
            case 'app.drenagemTanque':
                rota = 'app.ab';
                break;
            case 'app.drenagemTanqueEditar':
                rota = 'app.drenagemTanque';
                break;
            case 'app.trocaElementoFiltrante':
                rota = 'app.ab';
                break;
            case 'app.trocaElementoFiltranteEdit':
                rota = 'app.trocaElementoFiltrante';
                break;
            case 'app.controleLubrificacao':
                rota = 'app.ab';
                break;
            case 'app.controleLubrificacaoEdit':
                rota = 'app.controleLubrificacao';
                break;
            case 'app.consumoGraxa':
                rota = 'app.ab';
                break;
            case 'app.consumoGraxaEdit':
                rota = 'app.consumoGraxa';
                break;
            case 'app.localizacaoPatrimonio':
                rota = 'app.ab';
                break;
            case 'app.ab':
                rota = 'app.components';
                break;
            default:
                window.history.back();
                break;
        };

        if (rota) {
            $state.go(rota);
        }
    }

});