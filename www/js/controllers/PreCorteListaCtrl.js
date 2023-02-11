app.controller("PreCorteListaCtrl", function (
  $scope,
  $stateParams,
  banco,
  $state,
  ionicMaterialInk,
  $ionicPopup,
  DatabaseValues,
  $ionicLoading
) {
	 
  var _inicioLoad = function () {
    $ionicLoading.show({
      template:
        '<div class="loader"><svg class="circular"><circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"/></svg></div>',
    });
  };

  var _fimLoad = function () {
    $ionicLoading.hide();
  };

  $scope.fazendas = [];

  var _buscarFazendas = async function () {   
    var sql = `SELECT * FROM plots group by fazenda`;

    var params = [];
    var resultado = await banco.executa(sql, params);
    var lista = Array.from(resultado.rows);
    console.log("lista == ",lista);
    $scope.fazendas = lista.length > 0 ? lista : [];
  };

	var _init = async function () {
    _inicioLoad();
    await _buscarFazendas ();
    _fimLoad();
  };

  _init();

  
  

    $scope.showAlert = function (titulo, msg) {
      var alertPopup = $ionicPopup.alert({
        title: titulo,
        template: msg,
      });

      alertPopup.then(function (res) {
        console.log("Thank you for not eating my delicious ice cream cone");
      });
    };


    $scope.acessoTalhoes = function(params){
      $state.go('app.listaTalhao', {fazenda: angular.toJson(params)});
    }


});
