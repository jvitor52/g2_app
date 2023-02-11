app.controller('ComponentsCtrl', function($scope, $stateParams, ionicMaterialInk, DatabaseValues, $state, $filter, $cordovaNetwork,$ionicPopup,$ionicLoading,banco,$cordovaGeolocation) {

    $scope.usuarioNome = '';
    $scope.usuario = '';

    var watchOptions = {
        timeout: 5000,
        maximumAge: 3000,
        enableHighAccuracy: true, // may cause errors if true
    };

    var _inicioLoad = function () {
        $ionicLoading.show({
            template:
            '<div class="loader"><svg class="circular"><circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"/></svg></div>',
        });
    };

    var _fimLoad = function () {
        $ionicLoading.hide();
    };
    console.log('estuo aquiiiii');
    var _init = async function (talhao,fazenda) {
        _inicioLoad();
        var logado = await _checkLogin(talhao,fazenda);
        console.log(logado);

        var sql = `SELECT * FROM plots`;
    
        var params = [];
        var resultado = await banco.executa(sql, params);
        var lista = Array.from(resultado.rows);

        if(lista.length == 0){
            banco.executa(
            `insert into plots (atividade, bloco, fazenda,up,talhao,parcela , area_talhao, especie, material, espacamento , plantio , refime, lado1 , lado2 , area_parcela , tipo , ciclo , rotacao , situacao , medir , status , data_realizacao , observacao , zona_utm , log_x, lat_y ,alt_z )
            values('IFC','IFC- TUR','VJQ - Campo Limpo IV','VJQ - Campo Limpo IV','VJ092','3','2000','','','','','','12,62','','500','I','','','','SIM','','','','23k','720897','8104089',''),
            ('IFC','IFC- TUR','VJQ - Campo Limpo IV','VJQ - Campo Limpo IV','VJ093','2','1850','','','','','','12,62','','400','I','','','','SIM','','','','23k','721499','8103968','');`
            );
        }else{
            console.log('encontrou registros');
        }

        $cordovaGeolocation.getCurrentPosition(watchOptions).then(
            function (position) {

            }
        );

        _fimLoad();
        if(logado){
            $state.go('app.inicio');
        }
    };

    var _checkLogin = async function (talhao,fazenda) {   
        var sql = `SELECT * FROM usuario`;
    
        var params = [];
        var resultado = await banco.executa(sql, params);
        var lista = Array.from(resultado.rows);
        var retult = lista.length > 0 ? true : false;
        return retult;
    };

    _init();

    $scope.getUsuario = function() {
        $scope.os = [];
        DatabaseValues.setup();
        DatabaseValues.bancoDeDados.transaction(function(transacao) {
            var log = [];
            var sql = "SELECT * from usuario ";
            var params = [];
            transacao.executeSql(sql, params, function(tx, result) {
                for (var i = 0; i < result.rows.length; i++) {

                    var row = result.rows.item(i);

                    $scope.usuarioNome = row.nome;
                    $scope.$apply();
                }
            }, function(tx, error) {
                //console.log('deu errado');
                console.log(error.message);
            });
        });
    }

    $scope.getUsuario();

    

    $scope.mat = 0;
    $scope.ip = '';
   

    function onOnline() {
        // Handle the online event
        var networkState = navigator.connection.type;

        if (networkState !== Connection.NONE) {
            return true;
        } else {
            return false;
        }
    }

   
    $scope.matricula = '';


    $scope.logoff = function() {
        DatabaseValues.setup();
        DatabaseValues.bancoDeDados.transaction(function(transacao) {

            var sql = "delete from usuario";
            var params = [];

            transacao.executeSql(sql, params, function() {
                $scope.gif = false;
                $scope.mat = 0;
                $scope.$apply();
                $state.go('app.components');
            }, function(transacao, erro) {
                console.log(erro.message);
            });



        });
    }
    $scope.showAlert = function (titulo, msg) {
        var alertPopup = $ionicPopup.alert({
          title: titulo,
          template: msg,
        });
  
        alertPopup.then(function (res) {
          console.log("Thank you for not eating my delicious ice cream cone");
        });
      };

    $scope.salvar = function() {
        console.log('Aqui',$scope.usuario);
        console.log('Aqui',$scope.senha);
        if ($scope.usuario != '' && $scope.senha != '') {
            if (onOnline()) {                        
                $scope.sincroniaMSG = '';
                
                DatabaseValues.setup();
                DatabaseValues.bancoDeDados.transaction(function(transacao) {
                    var sql = 'INSERT INTO usuario (nome, senha) VALUES(?,?);';
                    params = [$scope.usuario, $scope.senha];

                    transacao.executeSql(sql, params, function() {

                    }, function(transacao, erro) {
                        alert(erro.message);
                    });

                    
                    $state.go('app.inicio');
                });                                
            } else {

                $scope.showAlert('Atenção', '<p>Verifique sua conexão com a Internet</p>');

            }
                    

        }else{
            $scope.showAlert('Atenção', '<p>Informe o Nome e Senha</p>');
        }
    }


});