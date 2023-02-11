app.controller("ListaParcelaCtrl", function (
  $scope,
  $stateParams,
  banco,
  $state,
  ionicMaterialInk,
  $ionicPopup,
  DatabaseValues,
  $ionicLoading,
  $cordovaGeolocation
) {
	 
    $scope.parcelas = [];
    $scope.talhaoObj = {};
    $scope.lancamento = {};
    $scope.lancamentoArv = {};
    $scope.listaArvores = [];
    $scope.listaArvoresDominantes = [];
    $scope.lancamentoParcela = {};
    $scope.contAtual = 0;
    $scope.contTotal = 0;
    $scope.linhaAtual = 1;
    $scope.arvoreAtual = 1;

    var _inicioLoad = function () {
        $ionicLoading.show({
            template:
            '<div class="loader"><svg class="circular"><circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"/></svg></div>',
        });
    };

    var _fimLoad = function () {
        $ionicLoading.hide();
    };

    var _buscarParcelas = async function (talhao,fazenda) {   
        var sql = `SELECT * FROM plots where talhao = ? and fazenda = ? group by talhao,fazenda,parcela`;
    
        var params = [talhao,fazenda];
        var resultado = await banco.executa(sql, params);
        var lista = Array.from(resultado.rows);
        console.log("params == ", params);
        $scope.parcelas = lista.length > 0 ? lista : [];
        
    };

    var _listarArvores = async function (lancamentoId) {   
        var sql = `SELECT * FROM plots_lancamento_arv where plots_lancamento_id = ?`;
    
        var params = [lancamentoId];
        var resultado = await banco.executa(sql, params);
        var lista = Array.from(resultado.rows);
        console.log("lista == ", lista.length);
        $scope.listaArvores = lista.length > 0 ? lista : [];
        if(lista.length > 0){
            let ultReg = $scope.listaArvores.length > 0 ? lista[lista.length - 1] : {};
            
            if(ultReg.fim_linha == 'S'){
                $scope.linhaAtual = ultReg.linha+1;
                $scope.arvoreAtual = 1;
            }else{
                $scope.linhaAtual = ultReg.linha;
                $scope.arvoreAtual = ultReg.arvore+1;
            }
            $scope.lancamentoArv.linha_arvore = $scope.linhaAtual+' - '+$scope.arvoreAtual;
            $scope.contAtual = 0;
            for (i = 0; i < lista.length; i++) {
                let atual = lista[i];
                if(atual.dominante == 'S'){
                    $scope.contAtual++;
                }    
            }
            console.log("ultReg == ",ultReg);
        }
        $scope.$apply();
    };

    var _listarArvoresDominante = async function (lancamentoId) {   
        var sql = `SELECT * FROM plots_lancamento_arv where plots_lancamento_id = ? and dominante = 'S'`;
    
        var params = [lancamentoId];
        var resultado = await banco.executa(sql, params);
        var lista = Array.from(resultado.rows);
        console.log("lista == ", lista.length);
        $scope.listaArvoresDominantes = lista.length > 0 ? lista : [];
        
        $scope.$apply();
    };

    var _buscarUsuario = async function () {   
        var sql = `SELECT * FROM usuario order by id limit 1`;
    
        var params = [];
        var resultado = await banco.executa(sql, params);
        var lista = Array.from(resultado.rows);
        console.log("lista == ", lista);
        $scope.lancamento.responsavel = lista.length > 0 ? lista[0].nome : '';
        $scope.lancamento.responsavelId = lista.length > 0 ? lista[0].id : null;
    };

    var _init = async function (talhao,fazenda) {
        _inicioLoad();
        await _buscarParcelas(talhao,fazenda);
        _fimLoad();
    };


    if ($stateParams.talhao) {
        $scope.talhaoObj = angular.fromJson($stateParams.talhao);
        console.log("$scope.talhaoObj == ",$scope.talhaoObj);
        _init($scope.talhaoObj.talhao,$scope.talhaoObj.fazenda);
    }

    if($stateParams.lancamento){
        $scope.lancamentoParcela = angular.fromJson($stateParams.lancamento);        
        $scope.lancamentoArv.martrix = 'Normal';
        $scope.lancamentoArv.linha_arvore = '1 - 1';
        $scope.lancamentoArv.numero = 0;
        $scope.contTotal = $scope.lancamentoParcela.area_parcela / 100;
        _listarArvores($scope.lancamentoParcela.id);
        console.log("$scope.contTotal == ",$scope.contTotal/100);
    }

    if($stateParams.lancamentoParcela){
        $scope.lancamentoParcela = angular.fromJson($stateParams.lancamentoParcela);        
        _listarArvoresDominante($scope.lancamentoParcela.id);
    }
    

    var watchOptions = {
        timeout: 5000,
        maximumAge: 3000,
        enableHighAccuracy: true, // may cause errors if true
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

    var _buscarPlotsLancamento = async function (parcela,fazenda,talhao) {   
        var sql = `SELECT * FROM plots_lancamento where parcela = ? and fazenda = ? and talhao = ?   order by id limit 1`;
    
        var params = [parcela,fazenda,talhao];
        var resultado = await banco.executa(sql, params);
        var lista = Array.from(resultado.rows);
        if(lista.length > 0){
            $scope.lancamento = lista[0];
            $scope.lancamento.lat  = $scope.lancamento.lat_y;
            $scope.lancamento.long = $scope.lancamento.log_x;
            $scope.lancamento.hora_inicio = $scope.lancamento.hora_inicio  ? new Date($scope.lancamento.hora_inicio ) : null; 
            $scope.lancamento.hora_fim = $scope.lancamento.hora_fim  ? new Date($scope.lancamento.hora_fim ) : null;
        }else{
            $cordovaGeolocation.getCurrentPosition(watchOptions).then(
                function (position) {
                  console.log("position == ", position)
                  $scope.lancamento.lat = position.coords.latitude;
                  $scope.lancamento.long = position.coords.longitude;
                  delete $scope.lancamento.id;
                  console.log('$scope.lancamento == ',$scope.lancamento);
                },
                function (err) {
                  // error
                  console.log("polling error", err);
                }
              );
    
        }
    };

    $scope.buscarPlotsLancamento = async function(parcela,fazenda,talhao){
        _inicioLoad();
        await _buscarPlotsLancamento(parcela,fazenda,talhao);
        await _buscarUsuario();
        _fimLoad();
    }

    if ($stateParams.parcela) {
        $scope.lancamento = angular.fromJson($stateParams.parcela);
        $scope.buscarPlotsLancamento($scope.lancamento.parcela,$scope.lancamento.fazenda,$scope.lancamento.talhao);        
    }

    $scope.acessoParcelas = function () {
        $state.go('app.listaTalhao');
    };

    $scope.lancarParcelas = function (params) {
        $state.go('app.lancarParcela', {parcela: angular.toJson(params)});
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

	
    $scope.finalizar = function(){
        var confirmPopup = $ionicPopup.confirm({
            title: "Atenção",
            template: "Confirma a Finalização da Parcela?",
        });

        confirmPopup.then(function (res) {
            if (res) {
                $state.go('app.finalizarParcela', {lancamentoParcela: angular.toJson($scope.lancamentoParcela)});
            }
        })
    }

    $scope.cancelarLancArvore = function(){
        $state.go('app.lancamentoHome');
    }

    $scope.salvar = function(){
        let msg = '';
        let erro = false;
        const titulo = '<span class="titleModal">Atenção</span>';
        if(!$scope.lancamento.formato){
            msg += '<p>Selecione o Formato</p>';
            erro = true;
        }
        console.log("$scope.lacamento.long == ",$scope.lancamento);
        if((!$scope.lancamento.lat) || (!$scope.lancamento.long)){
            msg += '<p>Não foi possível capturar sua localização, verifique se o GPS está ativo</p>';
            erro = true;
        } 
        console.log($scope.lancamento);

        if(erro){
            $scope.showAlert(titulo,msg);
        }else{
            DatabaseValues.setup();
            DatabaseValues.bancoDeDados.transaction(function (transacao) {
                if(!$scope.lancamento.id){

                    var params = [
                        tratamento($scope.lancamento.atividade),
                        tratamento($scope.lancamento.bloco),
                        tratamento($scope.lancamento.fazenda),
                        tratamento($scope.lancamento.up),
                        tratamento($scope.lancamento.talhao),
                        tratamento($scope.lancamento.parcela),
                        tratamento($scope.lancamento.area_talhao),
                        tratamento($scope.lancamento.lado1),
                        tratamento($scope.lancamento.area_parcela),
                        tratamento($scope.lancamento.tipo),
                        tratamento($scope.lancamento.situacao),
                        tratamento($scope.lancamento.medir),
                        tratamento($scope.lancamento.status),
                        tratamento(new Date()),
                        tratamento($scope.lancamento.observacao),
                        tratamento($scope.lancamento.zona_utm),
                        tratamento($scope.lancamento.log_x),
                        tratamento($scope.lancamento.lat_y),
                        tratamento($scope.lancamento.long),
                        tratamento($scope.lancamento.lat),
                        tratamento($scope.lancamento.alt_z),
                        tratamento($scope.lancamento.formato),
                        tratamento(new Date()),
                        tratamento(null),
                        tratamento($scope.lancamento.responsavelId)
                      ];
          
                      var sql = `INSERT INTO plots_lancamento(atividade, bloco, fazenda,up,talhao,parcela, area_talhao, lado1, area_parcela, tipo, situacao, medir, status, data_realizacao, observacao, zona_utm, log_x, lat_y, lat, long,alt_z, formato, hora_inicio, hora_fim, responsavel) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
                      transacao.executeSql(sql, params, function (tx, result) {
                        $scope.lancamento.id = result.insertId;
                        console.log(result)
                        $state.go('app.lancarArvore', {lancamento: angular.toJson($scope.lancamento)});
                      },
                      function (transacao, erro) {
                        alert("Erro : " + erro.message);
                      }); 
                }else{
                    var params = [                        
                        tratamento($scope.lancamento.observacao),
                        tratamento($scope.lancamento.id)
                    ];

                    var sql = `UPDATE plots_lancamento set observacao = ? WHERE id = ?`;
                    transacao.executeSql(sql, params, function (tx, result) {                        
                        $state.go('app.lancarArvore', {lancamento: angular.toJson($scope.lancamento)});
                    },
                    function (transacao, erro) {
                        alert("Erro : " + erro.message);
                    }); 
                }
                  
            });
        }
    }

    $scope.finalizarExclussao = async function(id){
        try {
            _inicioLoad();
            var params = [
                tratamento(id)
            ];
            console.log('id == ', id);
            var sql = `DELETE FROM plots_lancamento_arv WHERE id = ?`;
            console.log('aqui 1');
            await banco.executa(sql, params);
            console.log('aqui 2');
            await _listarArvores($scope.lancamentoParcela.id);
            _fimLoad();    
        } catch (error) {
            _fimLoad();
        }        
    }

    $scope.excluirArvore = async function(id){
        try {
            const titulo = '<span class="titleModal">Atenção</span>';
            var confirmPopup = $ionicPopup.confirm({
                title: titulo,
                template: "Tem certeza que deseja excluir?",
                cancelText: "Não",
                okText: "Sim",
            });
    
            confirmPopup.then(function (res) {
                if (res) {
                    $scope.finalizarExclussao(id);
                }
            })

            
        } catch (error) {
            _fimLoad();
        }
            
    }


    $scope.concluir = async function(){
        var erro = false;
        var msgAlerta = '';
        const titulo = '<span class="titleModal">Atenção</span>';
        for(var i = 0; i < $scope.listaArvoresDominantes.length; i++){
            var linha = $scope.listaArvoresDominantes[i];
            if(!linha.altura){
                erro = true;
                msgAlerta += '<p>Informe a altura para Linha :'+linha.linha+' arvore : '+linha.numero+'</p>';
            }            
        }

        if(erro){
            $scope.showAlert(titulo,msgAlerta);
        }else{
            _inicioLoad()
            var params = [                        
                tratamento(new Date()),
                tratamento(true),
                tratamento($scope.lancamentoParcela.id)
            ];

            var sql = `UPDATE plots_lancamento set hora_fim = ?,  status = ? WHERE id = ?`;

            await banco.executa(sql, params);
 
            var params = [                        
                tratamento(true),
                tratamento($scope.lancamentoParcela.fazenda),
                tratamento($scope.lancamentoParcela.talhao),
                tratamento($scope.lancamentoParcela.parcela)
            ];

            var sql = `UPDATE plots set status = ? WHERE fazenda = ? and talhao = ? and parcela = ?`;

            await banco.executa(sql, params);

            for(var i = 0; i < $scope.listaArvoresDominantes.length; i++){
                var linha = $scope.listaArvoresDominantes[i];

                var paramsParc = [                        
                    tratamento(linha.altura),
                    tratamento(linha.id)
                ];
    
                var sqlParc = `UPDATE plots_lancamento_arv set altura = ? WHERE id = ?`;

                await banco.executa(sqlParc, paramsParc);
            }
            _fimLoad();
            $state.go('app.lancamentoHome');
        }
    }

    $scope.salvarArvore = function(){
        let msg = '';
        let erro = false;
        const titulo = '<span class="titleModal">Atenção</span>';
        console.log($scope.lancamentoArv);
        if(!$scope.lancamentoArv.dap){
            msg += '<p>Informe o DAP</p>';
            erro = true;
        }
        
        if(erro){
            $scope.showAlert(titulo,msg);
        }else{
            DatabaseValues.setup();
            DatabaseValues.bancoDeDados.transaction(async function (transacao) {
                var params = [
                    tratamento($scope.lancamentoParcela.id),
                    tratamento($scope.linhaAtual),
                    tratamento($scope.lancamentoArv.fim_linha ? 'S' : 'N'),
                    tratamento($scope.listaArvores.length + 1),
                    tratamento($scope.lancamentoArv.martrix),
                    tratamento($scope.arvoreAtual),
                    tratamento($scope.lancamentoArv.dap ? $scope.lancamentoArv.dap : 0),
                    tratamento($scope.lancamentoArv.altura ? $scope.lancamentoArv.altura : null),
                    tratamento($scope.lancamentoArv.dap2 ? $scope.lancamentoArv.dap2 : null),
                    tratamento($scope.lancamentoArv.alt_poda ? $scope.lancamentoArv.alt_poda : null),
                    tratamento($scope.lancamentoArv.dominante ? 'S' : 'N')
                  ];
      
                  var sql = `INSERT INTO plots_lancamento_arv(plots_lancamento_id , linha , fim_linha , numero , matrix, arvore ,dap ,altura,dap2, alt_poda , dominante) VALUES (?,?,?,?,?,?,?,?,?,?,?)`;
                  transacao.executeSql(sql, params,async function (tx, result) {                    

                    if($scope.lancamentoArv.dominante){
                        $scope.contAtual += 1;
                    }
                    let numTot = $scope.lancamentoArv.numero;
                    if(!$scope.lancamentoArv.fim_linha){
                        numTot += 1;
                        $scope.arvoreAtual += 1;
                    }else{
                        $scope.arvoreAtual = 1;
                        $scope.linhaAtual += 1;
                    }
                    $scope.lancamentoArv = {}
                    $scope.lancamentoArv.numero = numTot;
                    $scope.lancamentoArv.martrix = 'Normal';
                    $scope.lancamentoArv.linha_arvore = $scope.linhaAtual+' - '+$scope.arvoreAtual;
                    $scope.$apply();
                    await _listarArvores($scope.lancamentoParcela.id);
                  },
                  function (transacao, erro) {
                    alert("Erro : " + erro.message);
                  }); 
            });
        }
    }



});
