app.controller("ListaTalhaoCtrl", function (
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

  $scope.talhoes = [];
  $scope.fazenda = {};
	var _init = async function (fazenda) {
    _inicioLoad();
    await _buscarTalhoes (fazenda);
    _fimLoad();
    console.log("$scope.talhoes == ",$scope.talhoes);
  };

  var _buscarTalhoes = async function (fazenda) {   
    var sql = `SELECT * FROM plots where fazenda = ? group by fazenda,talhao`;

    var params = [fazenda];
    var resultado = await banco.executa(sql, params);
    var lista = Array.from(resultado.rows);
    console.log("lista == ", lista);
    $scope.talhoes = lista.length > 0 ? lista : [];
    
  };

  if ($stateParams.fazenda) {
    $scope.fazenda = angular.fromJson($stateParams.fazenda);
    _init($scope.fazenda.fazenda);
    console.log('$scope.fazenda == ', $scope.fazenda);
  }

  $scope.acessoParcelas = function (params) {
      $state.go('app.listaParcela', {talhao: angular.toJson(params)});
  };

  $scope.showAlert = function (titulo, msg) {
    var alertPopup = $ionicPopup.alert({
      title: titulo,
      template: msg,
  });

  alertPopup.then(function (res) {
    console.log("Thank you for not eating my delicious ice cream cone");
  });
};

	



});
