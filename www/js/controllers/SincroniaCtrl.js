app.controller("SincroniaCtrl", function (
  $scope,
  $http,
  $ionicModal,
  $stateParams,
  $state,
  ionicMaterialInk,
  DatabaseValues,
  $ionicLoading,
  banco,
  $ionicPopup,
  $ionicPlatform,
  $cordovaFile
) {
  var devMode = true;
  var tempo = 0;
  var tempoInicial = 0;

  $scope.enviouTudo = false;
  $scope.versao = "";
  $scope.tempoEspera = 0;
  $scope.min =5;
  $scope.seg = 1;

  $scope.calcTempoEspera = function () {
    $scope.tempoEspera = 1;
    $scope.sincroniaMSG = '';
    tempo_espera = setInterval(function () {
        if ($scope.min > 0 || $scope.seg > 0) {
          if($scope.seg == 0){					
            $scope.seg = 59;					
            $scope.min = $scope.min - 1	
          }				
          else{					
            $scope.seg = $scope.seg - 1;				
          }				
          if($scope.min.toString().length == 1){					
            $scope.min = "0" + $scope.min;				
          }				
          if($scope.seg.toString().length == 1){					
            $scope.seg = "0" + $scope.seg;				
          }           
        } else {
            $scope.tempoEspera = 0;
            clearTimeout(tempo_espera);
        }
        $scope.$apply();
    }, 1000);
    $scope.$apply();
}

  $ionicPlatform.ready(function () {
    try {
      cordova.getAppVersion.getVersionNumber().then(function (version) {
        $scope.versao = version;
      });
    } catch (e) {
      console.log("error:" + e);
    }
  });

  var _pegarRota = function (ip, type) {
    var porta = ":8081";
    var prefix = "http://";
    let infPort = ip.indexOf(":") != -1 ? true : false;    
    if ($scope.porta443) {
      porta = "";
      prefix = "https://";
    }
    if(infPort){
        porta = "";
    }
    var url =
      prefix +
      ip +
      porta +
      "/florestal/webservices/ws_colheita_wrk/ws_colheita.php";

    if (type === "GET") {
      return url + "?recebimento=1";
    } else if (type === "POST") {
      return url;
    }
  };

  var _manipulaError = function (msg, ex, sql) {
    if (devMode) {
      if (angular.isString(ex)) {
        alert(ex);
      } else if (ex.message) {
        alert(ex.message);
        if (sql) {
          alert(sql);
        }
      } else {
        alert(JSON.stringify(ex));
      }

      alert("SQL ->>", sql);

      if (msg) {
        alert(msg);
      } else {
        alert("Erro crítico entre em contato com suporte!");
      }
    }

    console.error(ex);

    //_fimLoad(true);
  };

  var _inicioLoad = function (texto) {
    var template = `<div class="loader"><svg class="circular"><circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"/></svg> ${texto} {{total}}</div>`;

    $ionicLoading.show({
      template: template,
    });

    if (tempo) {
      console.info(`${texto}: ${(new Date().getTime() - tempo) / 1000}s`);
    }

    tempo = new Date().getTime();

    if (!tempoInicial) {
      tempoInicial = new Date().getTime();
    }
  };

  var _fimLoad = function (erro) {
    if (!erro) $ionicLoading.hide();
    console.info(`Fim: ${(new Date().getTime() - tempo) / 1000}s`);
    console.info(`Total: ${(new Date().getTime() - tempoInicial) / 1000}s`);
    tempo = 0;
    tempoInicial = 0;
  };

  var _trataBind = function (valor) {
    return valor ? `"${valor}"` : null;
  };

  var horaTrabalhadaMaquinaPlaca = async function (data) {
    try {
      _inicioLoad("Atualizando Abastecimento [HORA MAQUINA PLACA]");
      var lista = data["hora_trabalhada_maquina_placa"];
      if (!lista || !lista.length) {
        return;
      }

      var sqlInsert = null;

      for (var i = 0; i < lista.length; i++) {
        var object = lista[i];

        var sql =
          "select id from hora_trabalhada_maquina where codigo_intermediario = ? limit 1";
        var params = [object.lanca_hora_maquina_diario_prod_id];
        var resultado = await banco.executa(sql, params);

        if (resultado.rows.length) {
          var idPai = resultado.rows[0].id;

          if (!sqlInsert) {
            sqlInsert =
              "INSERT INTO `hora_trabalhada_maquina_placa` (hora_trabalhada_maquina,placa,tipo,codigo_intermediario,sync) VALUES ";
          }

          sqlInsert += `(${_trataBind(idPai)}, ${_trataBind(
            object.placa
          )}, ${_trataBind(object.tipo)}, ${_trataBind(object.id)}, 1),`;
        }
      }

      if (sqlInsert) {
        sqlInsert = sqlInsert.slice(0, -1) + ";";
        await banco.executa(sqlInsert);
      }
    } catch (ex) {
      _manipulaError("Erro ao atualizar Hora Máquina Placa", ex, sqlInsert);
    }
  };

  var horaTrabalhadaMaquinaCiclo = async function (data) {
    try {
      _inicioLoad("Atualizando Abastecimento [HORA MAQUINA CICLO]");

      var lista = data["hora_trabalhada_maquina_ciclo"];
      if (!lista || !lista.length) {
        return;
      }

      var ids = lista.map((x) => x.lanca_hora_maquina_diario_prod_id);

      var sql = `SELECT id, codigo_intermediario FROM hora_trabalhada_maquina where codigo_intermediario IN(${ids.join(
        ","
      )});`;
      var resultado = await banco.executa(sql);
      var hTMs = Array.from(resultado.rows);
      var sqlInsert = null;

      for (var i = 0; i < lista.length; i++) {
        var object = lista[i];
        var htm = hTMs.find(
          (x) =>
            parseInt(x.codigo_intermediario) ===
            parseInt(object.lanca_hora_maquina_diario_prod_id)
        );
        if (!htm) {
          continue;
        }

        var idPai = htm.id;
        if (!sqlInsert) {
          sqlInsert =
            "INSERT INTO hora_trabalhada_maquina_ciclo (hora_trabalhada_maquina,data,hora,inicio,fim,latitude,longitude,codigo_intermediario,sync) VALUES ";
        }

        sqlInsert += `(${idPai}, ${_trataBind(object.data)}, ${_trataBind(
          object.hora
        )}, ${_trataBind(object.inicio)}, ${_trataBind(
          object.fim
        )}, ${_trataBind(object.latitude)}, ${_trataBind(
          object.longitude
        )}, ${_trataBind(object.id)}, 1),`;
      }

      if (sqlInsert) {
        sqlInsert = sqlInsert.slice(0, -1) + ";";
        await banco.executa(sqlInsert);
      }
    } catch (ex) {
      _manipulaError("Erro ao atualizar Hora Máquina Ciclo", ex, sqlInsert);
    }
  };

  var horaTrabalhadaMaquinaSortimento = async function (data) {
    try {
      _inicioLoad("Atualizando Abastecimento [HORA MAQUINA SORTIMENTO]");

      var lista = data["hora_trabalhada_maquina_sortimento"];
      if (!lista || !lista.length) {
        return;
      }

      var ids = lista.map((x) => x.lanca_hora_maquina_diario_prod_id);

      var sql = `SELECT id, codigo_intermediario FROM hora_trabalhada_maquina WHERE codigo_intermediario IN(${ids.join(
        ","
      )});`;
      var resultado = await banco.executa(sql);
      var hTMs = Array.from(resultado.rows);

      var sqlInsert = null;

      for (var i = 0; i < lista.length; i++) {
        var object = lista[i];
        var htm = hTMs.find(
          (x) =>
            parseInt(x.codigo_intermediario) ===
            parseInt(object.lanca_hora_maquina_diario_prod_id)
        );
        if (htm) {
          var idPai = htm.id;
          var sync = 1;
          if (!sqlInsert) {
            sqlInsert =
              "INSERT INTO hora_trabalhada_maquina_sortimento (hora_trabalhada_maquina,material,medida,quantidade,placa,numero_guia,codigo_intermediario,sync) VALUES ";
          }

          sqlInsert += `(${idPai}, ${_trataBind(
            object.material_id
          )}, ${_trataBind(object.sortimento_id)}, ${_trataBind(
            object.quantidade
          )}, ${_trataBind(object.placa)}, ${_trataBind(object.numero_guia)}, ${object.id
            }, ${sync}),`;
        }
      }

      if (sqlInsert) {
        sqlInsert = sqlInsert.slice(0, -1) + ";";
        await banco.executa(sqlInsert);
      }
    } catch (ex) {
      _manipulaError(
        "Erro Hora Trabalhada Máquina Sortimento",
        ex,
        sqlInsert + sql
      );
    }
  };

  var controleDiarioFoto = async function (data) {
    try {
      _inicioLoad("Atualizando Abastecimento [CONTROLE FOTO]");

      var lista = data["controle_diario_foto"];
      if (!lista || !lista.length) {
        return;
      }

      var ids = lista.map((x) => x.lanca_diario_prod_id);
      var sql = `SELECT id, codigo_intermediario FROM controle_diario WHERE codigo_intermediario IN(${ids.join(
        ","
      )});`;
      var resultado = await banco.executa(sql);
      var listaCDs = Array.from(resultado.rows);

      var sqlInsert = null;

      for (var i = 0; i < lista.length; i++) {
        var object = lista[i];

        var cd = listaCDs.find(
          (cd) =>
            parseInt(cd.codigo_intermediario) ===
            parseInt(object.lanca_diario_prod_id)
        );
        if (cd) {
          var idPai = cd.id;

          if (!sqlInsert) {
            sqlInsert =
              "INSERT INTO `controle_diario_foto` (controle_diario,foto,latitude,longitude,observacao,sync,codigo_intermediario) VALUES ";
          }

          sqlInsert += `(${_trataBind(idPai)}, ${_trataBind(
            object.foto
          )}, ${_trataBind(object.latitude)}, ${_trataBind(
            object.longitude
          )}, ${_trataBind(object.observacao)}, 1, ${_trataBind(object.id)}),`;
        }
      }

      if (sqlInsert) {
        sqlInsert = sqlInsert.slice(0, -1) + ";";
        await banco.executa(sqlInsert);
      }
    } catch (ex) {
      _manipulaError("Erro no Controle Foto", ex, sql);
    }
  };

  var controleDiarioComponente = async function (data) {
    try {
      _inicioLoad("Atualizando Abastecimento [CONTROLE COMPONENTE]");

      var lista = data["controle_diario_componente"];
      if (!lista || !lista.length) {
        return;
      }

      var ids = lista.map((x) => x.lanca_diario_prod_id);
      var sql = `SELECT id, codigo_intermediario FROM controle_diario WHERE codigo_intermediario IN(${ids.join(
        ","
      )});`;
      var resultado = await banco.executa(sql);
      var listaCDs = Array.from(resultado.rows);

      var sqlInsert = null;
      for (var i = 0; i < lista.length; i++) {
        var object = lista[i];

        var cd = listaCDs.find(
          (cd) =>
            parseInt(cd.codigo_intermediario) ===
            parseInt(object.lanca_diario_prod_id)
        );
        if (cd) {
          var idPai = cd.id;

          if (!sqlInsert) {
            sqlInsert =
              "INSERT INTO `controle_diario_componente` (componente_id,fornecedor_id,qtd_pagamento,horas,controle_diario_id,usuario,sync,codigo_intermediario) VALUES ";
          }

          sqlInsert += `(${_trataBind(object.componente_id)}, ${_trataBind(
            object.fornecedor_id
          )}, ${_trataBind(object.qtd_pagamento)}, ${_trataBind(
            object.horas
          )}, ${_trataBind(idPai)}, ${_trataBind(
            object.matricula_id
          )}, 1, ${_trataBind(object.id)}),`;
        }
      }

      if (sqlInsert) {
        sqlInsert = sqlInsert.slice(0, -1) + ";";
        await banco.executa(sqlInsert);
      }
    } catch (ex) {
      _manipulaError("Erro no Controle Componente", ex, sql);
    }
  };

  var controleDiarioInsumo = async function (data) {
    try {
      _inicioLoad("Atualizando Abastecimento [CONTROLE INSUMO]");

      var lista = data["controle_diario_insumo"];
      if (!lista || !lista.length) {
        return;
      }

      var ids = lista.map((x) => x.lanca_diario_prod_id);
      var sql = `SELECT id, codigo_intermediario FROM controle_diario WHERE codigo_intermediario IN(${ids.join(
        ","
      )});`;
      var resultado = await banco.executa(sql);
      var listaCDs = Array.from(resultado.rows);

      var sqlInsert = null;
      for (var i = 0; i < lista.length; i++) {
        var object = lista[i];

        var cd = listaCDs.find(
          (cd) =>
            parseInt(cd.codigo_intermediario) ===
            parseInt(object.lanca_diario_prod_id)
        );
        if (cd) {
          var idPai = cd.id;

          if (!sqlInsert) {
            sqlInsert =
              "INSERT INTO `controle_diario_insumo` (insumo,unidade,quantidade,controle_diario_id,usuario,sync,codigo_intermediario) VALUES ";
          }

          sqlInsert += `(${_trataBind(object.material_id)}, ${_trataBind(
            object.unidade_id
          )}, ${_trataBind(object.quantidade)}, ${_trataBind(
            idPai
          )}, ${_trataBind(object.matricula_id)}, 1, ${_trataBind(
            object.id
          )}),`;
        }
      }

      if (sqlInsert) {
        sqlInsert = sqlInsert.slice(0, -1) + ";";
        await banco.executa(sqlInsert);
      }
    } catch (ex) {
      _manipulaError("Erro no Controle Insumo", ex, sql);
    }
  };

  var controleDiarioPlantio = async function (data) {
    try {
      _inicioLoad("Atualizando Abastecimento [CONTROLE PLANTIO]");

      var lista = data["controle_diario_plantio"];
      if (!lista || !lista.length) {
        return;
      }

      var ids = lista.map((x) => x.lanca_diario_prod_id);
      var sql = `SELECT id, codigo_intermediario FROM controle_diario WHERE codigo_intermediario IN(${ids.join(
        ","
      )});`;
      var resultado = await banco.executa(sql);
      var listaCDs = Array.from(resultado.rows);

      var sqlInsert = null;
      for (var i = 0; i < lista.length; i++) {
        var object = lista[i];

        var cd = listaCDs.find(
          (cd) =>
            parseInt(cd.codigo_intermediario) ===
            parseInt(object.lanca_diario_prod_id)
        );
        if (cd) {
          var idPai = cd.id;

          if (!sqlInsert) {
            sqlInsert =
              "INSERT INTO `controle_diario_plantio` (espacamento,data,material_genetico,classe_recipiente,quantidade_plantada,quantidade_perda,controle_diario_id,sync,codigo_intermediario) VALUES ";
          }

          sqlInsert += `(${_trataBind(object.espacamento_id)}, ${_trataBind(
            object.data
          )}, ${_trataBind(object.material_genetico_id)}, ${_trataBind(
            object.classe_recipiente_id
          )}, ${_trataBind(object.quantidade_plantada)}, ${_trataBind(
            object.quantidade_perda
          )}, ${_trataBind(idPai)}, 1, ${_trataBind(object.id)}),`;
        }
      }

      if (sqlInsert) {
        sqlInsert = sqlInsert.slice(0, -1) + ";";
        await banco.executa(sqlInsert);
      }
    } catch (ex) {
      _manipulaError("Erro no Controle Plantio", ex, sql);
    }
  };

  var _backUpFamiliaHorasMaquinaControleDiario = async function () {
    try {
      _inicioLoad("Backup Família Horas Máquinas e Controle Diário");
      
      var data = new Object();

      var sql = `SELECT hm.*,cd.codigo_intermediario as idPai, cd.data as dataPai, cd.fazenda FROM hora_trabalhada_maquina hm inner join controle_diario cd on cd.id = hm.controle_diario WHERE hm.sync = 0 and cd.erro = 0`;
      var resultado = await banco.executa(sql);
      data.horaTrabalhadaMaquina = Array.from(resultado.rows);

      sql = `SELECT hp.*,cd.codigo_intermediario as idPai, cd.data as dataPai, cd.fazenda FROM hora_trabalhada_maquina_placa hp inner join hora_trabalhada_maquina hm on hm.id = hp.hora_trabalhada_maquina inner join controle_diario cd on cd.id = hm.controle_diario WHERE hp.sync = 0 and cd.erro = 0`;
      resultado = await banco.executa(sql);
      data.horaTrabalhadaMaquinaPlaca = Array.from(resultado.rows);

      /*sql = `SELECT hp.*,cd.codigo_intermediario as idPai, cd.data as dataPai, cd.fazenda 
            FROM hora_trabalhada_maquina_coordenadas hp 
            inner join hora_trabalhada_maquina hm on hm.id = hp.hora_trabalhada_maquina 
            inner join controle_diario cd on cd.id = hm.controle_diario 
            WHERE hp.sync = 0 and cd.erro = 0`;
      resultado = await banco.executa(sql);
      console.log(resultado.rows);
      data.horaTrabalhadaMaquinaCoordendada = Array.from(resultado.rows);*/

      sql = `SELECT hc.*,cd.codigo_intermediario as idPai, cd.data as dataPai, cd.fazenda, hm.random as randomPai FROM lancamento_serra_sabre hc inner join hora_trabalhada_maquina hm on hm.id = hc.hora_maquina_id inner join controle_diario cd on cd.id = hm.controle_diario WHERE hc.sync = 0 and cd.erro = 0`;
      resultado = await banco.executa(sql);
      data.manutSerraSabre = Array.from(resultado.rows);

      //data.solicitacaoMaterial = Array.from(resultado.rows);
      

      sql = `SELECT hc.*,cd.codigo_intermediario as idPai, cd.data as dataPai, cd.fazenda FROM hora_trabalhada_maquina_ciclo hc inner join hora_trabalhada_maquina hm on hm.id = hc.hora_trabalhada_maquina inner join controle_diario cd on cd.id = hm.controle_diario WHERE hc.sync = 0 and cd.erro = 0`;
      resultado = await banco.executa(sql);
      data.horaTrabalhadaMaquinaCiclo = Array.from(resultado.rows);

      sql = `SELECT hs.*,cd.codigo_intermediario as idPai, cd.data as dataPai, cd.fazenda FROM hora_trabalhada_maquina_sortimento hs  inner join hora_trabalhada_maquina hm on hm.id = hs.hora_trabalhada_maquina inner join controle_diario cd on cd.id = hm.controle_diario WHERE hs.sync = 0 and cd.erro = 0`;
      resultado = await banco.executa(sql);
      data.horaTrabalhadaMaquinaSortimento = Array.from(resultado.rows);

      sql = `SELECT hp.*,cd.codigo_intermediario as idPai,cg.id as idMaster, cd.data as dataPai, cd.fazenda FROM hora_trabalhada_pessoa hp inner join controle_diario cd on cd.id = hp.controle_diario inner join controle_diario_grupo cg on cg.id = cd.controle_diario_grupo where hp.sync = 0 and cd.erro = 0`;
      resultado = await banco.executa(sql);
      data.horaTrabalhadaPessoa = Array.from(resultado.rows);

      sql = "SELECT * FROM 'usuario'";
      resultado = await banco.executa(sql);
      var usuarios = Array.from(resultado.rows);
      if (usuarios.length) {
        var usuario = usuarios[usuarios.length - 1];
        data.usuario = usuario.nome;
        data.senha = usuario.senha;
        data.usuarioId = usuario.id;
        data.matricula = usuario.id;
      }

      sql = "SELECT * FROM 'config_ip'";

      resultado = await banco.executa(sql);
      var ips = Array.from(resultado.rows);
      if (ips.length) {
        data.ip = ips[ips.length - 1].ip;
        $scope.porta443 = ips[ips.length - 1].porta === 443;
      }

      data.aparelho = device.uuid;

      sql =
        "SELECT cd.* FROM controle_diario_grupo cd WHERE (cd.sync = 0 or cd.sync is null)";
      resultado = await banco.executa(sql);
      data.controleDiarioCabecalho = Array.from(resultado.rows);

      sql = "SELECT * FROM controle_diario_grupo WHERE finalizado = 1";
      resultado = await banco.executa(sql);
      data.controleDiarioCabecalhoFinalizado = Array.from(resultado.rows);

      sql = `SELECT cd.*,cg.codigo_intermediario as idPai, cd.data as dataPai, cd.fazenda                   
                   FROM controle_diario cd 
                   inner join controle_diario_grupo cg on cg.id = cd.controle_diario_grupo 
                   WHERE (cd.sync = 0 or cd.sync is null) and cd.erro = 0`;
      resultado = await banco.executa(sql);
      data.controleDiario = Array.from(resultado.rows);

      sql = `SELECT cc.*,cd.codigo_intermediario as idPai, cd.data as dataPai, cd.fazenda FROM controle_diario_componente cc inner join controle_diario cd on cd.id = cc.controle_diario_id WHERE cc.sync = 0 and cd.erro = 0`;
      resultado = await banco.executa(sql);
      data.controleDiarioComponente = Array.from(resultado.rows);

      sql =
        "SELECT cp.*,cd.codigo_intermediario as idPai, cd.data as dataPai, cd.fazenda FROM controle_diario_plantio cp inner join controle_diario cd on cd.id = cp.controle_diario_id WHERE cp.sync = 0 and cd.erro = 0";
      resultado = await banco.executa(sql);
      data.controleDiarioPlantio = Array.from(resultado.rows);

      sql =
        "SELECT ft.*,cd.codigo_intermediario as idPai, cd.data as dataPai, cd.fazenda FROM controle_diario_foto ft inner join controle_diario cd on cd.id = ft.controle_diario WHERE ft.sync = 0 and cd.erro = 0 ";
      resultado = await banco.executa(sql);
      data.controleDiarioFoto = Array.from(resultado.rows);

      sql =
        "SELECT ci.*,cd.codigo_intermediario as idPai, cd.data as dataPai, cd.fazenda FROM controle_diario_insumo ci inner join controle_diario cd on cd.id = ci.controle_diario_id WHERE ci.sync = 0 and cd.erro = 0 ";
      resultado = await banco.executa(sql);
      data.controleDiarioInsumo = Array.from(resultado.rows);

      sql = "SELECT * FROM controle_diario  WHERE finalizado = 1";
      resultado = await banco.executa(sql);
      data.controleDiarioFinalizado = Array.from(resultado.rows);

      const rota = _pegarRota(data.ip, "POST");

      $.ajax({
        url: rota,
        type: "POST",
        dataType: "json",
        data: { data: JSON.stringify(data) },
        success: async function () {
          await banco.executa("DELETE * FROM hora_trabalhada_maquina;");
          await banco.executa("DELETE * FROM hora_trabalhada_pessoa;");
          await banco.executa(
            "DELETE * FROM hora_trabalhada_maquina_sortimento;"
          );
          await banco.executa("DELETE * FROM hora_trabalhada_maquina_ciclo;");
          await banco.executa("DELETE * FROM hora_trabalhada_maquina_placa;");
          await banco.executa("DELETE * FROM controle_diario_grupo;");
          await banco.executa("DELETE * FROM controle_diario;");
          await banco.executa("DELETE * FROM controle_diario_componente;");
          await banco.executa("DELETE * FROM controle_diario_plantio;");
          await banco.executa("DELETE * FROM controle_diario_foto;");
          await banco.executa("DELETE * FROM controle_diario_insumo;");
        },
      });
    } catch (ex) {
      console.log(ex);
      _manipulaError("Erro ao fazer backup da família de HORAS MÁQUINA", ex);
    }
  };

  var _grupoDiario = async function (data) {
    try {
      //await _backUpFamiliaHorasMaquinaControleDiario();
      
      _inicioLoad("Atualizando Abastecimento [GRUPO DIARIO]");

      lista = Array.from(data["controle_diario_grupo"]);

      var sqlInsert = null;

      for (var i = 0; i < lista.length; i++) {
        var object = lista[i];

        var finalizado = object.finalizado == "S" ? 1 : 0;

        if (!sqlInsert) {
          sqlInsert =
            "INSERT INTO `controle_diario_grupo` (codigo,data,empresa,fazenda,projeto_estrutural,projeto_execucao,talhao,operacao,unidade,volume,faixa,qtd_pagamento,fornecedor,observacao,area_nao_talhonada,sync,finalizado,empresa_main,lanca_os_silvicultura,operacoes_os_silvicultura,usuario,codigo_intermediario,modulo) VALUES ";
        }

        sqlInsert += `(${_trataBind(object.codigo)}, ${_trataBind(
          object.data
        )}, ${_trataBind(object.empresa_main)}, ${_trataBind(
          object.fazenda_id
        )}, ${_trataBind(object.projeto_estrutural_id)}, 
${_trataBind(object.projeto_id)}, ${_trataBind(object.talhao_id)}, ${_trataBind(
          object.operacao_id
        )}, ${_trataBind(object.unidade_id)}, ${_trataBind(object.volume)}, 
${_trataBind(object.faixa_id)}, 0, ${_trataBind(
          object.fornecedor_id
        )}, ${_trataBind(object.observacao)}, ${_trataBind(
          object.area_nao_talhonada
        )}, 1, ${_trataBind(finalizado)}, 
${_trataBind(object.empresa_main)}, ${_trataBind(
          object.lanca_os_silvicultura_id
        )}, ${_trataBind(object.operacoes_os_silvicultura_id)}, ${_trataBind(
          object.matricula_id
        )}, 
${_trataBind(object.idNovo)}, ${_trataBind(object.modulo)}),`;
      }

      if (sqlInsert) {
        sqlInsert = sqlInsert.slice(0, -1) + ";";
        await banco.executa(sqlInsert);
        await controleDiario(data);
      } else {
        await _finalizaUpload(data);
      }
    } catch (ex) {
      _manipulaError("Erro ao Atualizar Grupo Diário", ex, sqlInsert);
    }
  };

  var _finalizaUpload = async function (data) {
    var sql = "SELECT * FROM empresa ORDER BY nome ASC";
    var resultado = await banco.executa(sql);
    $scope.$parent.empresas = Array.from(resultado.rows);

    await $scope.updateNome();

    $scope.atualizar = false;
    console.log(data);
    if(data.tempo_upload < Number(5)){
      $scope.sincroniaMSG = data.mensagem;
    }else{
      $scope.sincroniaMSG = "Banco mobile atualizado!";
    }
    $scope.sicronizando = false;
    $scope.atualizando = false;
  };

  var controleDiario = async function (data) {
    try {
      _inicioLoad("Atualizando Abastecimento [CONTROLE DIARIO]");

      var carregaProximaDependencia = async function (data) {
        await _horaPessoa(data);
        await _horaMaquina(data);

        await controleDiarioPlantio(data);
        await controleDiarioInsumo(data);
        await controleDiarioComponente(data);
        await controleDiarioFoto(data);

        await _finalizaUpload(data);
      };

      lista = Array.from(data["controle_diario"]);

      var uniaoLista = Array.from(data["controle_diario_uniao"]);

      uniaoLista = uniaoLista.filter((u) =>
        lista.some(
          (l) => parseInt(u.id) === parseInt(l.lanca_diario_prod_grupo_id)
        )
      );

      var ids = [];
      for (var i = 0; i < uniaoLista.length; i++) {
        var uniao = uniaoLista[i];
        if (
          lista.find(
            (l) => parseInt(uniao.id) === parseInt(l.lanca_diario_prod_grupo_id)
          )
        ) {
          if (uniao && uniao.idNovo) {
            ids.push(uniao.idNovo);
          }
        }
      }

      var sql = `SELECT codigo_intermediario, id FROM controle_diario_grupo WHERE codigo_intermediario IN(${ids.join(
        ","
      )});`;
      var resultado = await banco.executa(sql);
      var listaCDGs = Array.from(resultado.rows);

      var sqlInsert = null;
      for (var i = 0; i < lista.length; i++) {
        var object = lista[i];

        var cdg = listaCDGs.find(
          (cdg) =>
            parseInt(cdg.codigo_intermediario) ===
            parseInt(object.lanca_diario_prod_grupo_id)
        );
        if (cdg) {
          var idPai = cdg.id;

          var finalizado = 0;
          if (object.finalizado == "S") {
            finalizado = 1;
          }

          var finalizado = object.finalizado == "S" ? 1 : 0;

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO controle_diario (controle_diario_grupo,codigo,data,empresa,fazenda,
projeto_estrutural,projeto_execucao,talhao,operacao,unidade,
volume,faixa,qtd_pagamento,fornecedor,observacao,
area_nao_talhonada,sync,finalizado,erro, empresa_main,
lanca_os_silvicultura,operacoes_os_silvicultura,usuario,codigo_intermediario,modulo) VALUES `;
          }

          sqlInsert += `(${idPai}, ${_trataBind(object.codigo)}, ${_trataBind(
            object.data
          )}, ${_trataBind(object.empresa_main)}, ${_trataBind(
            object.fazenda_id
          )}, 
${_trataBind(object.projeto_estrutural_id)}, ${_trataBind(
            object.projeto_id
          )}, ${_trataBind(object.talhao_id)}, ${_trataBind(
            object.operacao_id
          )}, ${_trataBind(object.unidade_id)},
${_trataBind(object.volume)}, ${_trataBind(object.faixa_id)}, 0, ${_trataBind(
            object.fornecedor_id
          )}, ${_trataBind(object.observacao)}, 
${_trataBind(object.area_nao_talhonada)}, 1, ${finalizado}, 0, ${_trataBind(
            object.empresa_main
          )}, 
${_trataBind(object.lanca_os_silvicultura_id)}, ${_trataBind(
            object.operacoes_os_silvicultura_id
          )}, ${_trataBind(object.matricula_id)}, ${_trataBind(
            object.id
          )}, ${_trataBind(object.modulo)}),`;
        }
      }

      if (sqlInsert) {
        sqlInsert = sqlInsert.slice(0, -1) + ";";
        await banco.executa(sqlInsert);
        await carregaProximaDependencia(data);
      }
    } catch (ex) {
      _manipulaError("Erro ao tentar Atualizar Controle Diário", ex, sqlInsert);
    }
  };

  var _horaPessoa = async function (data) {
    try {
      _inicioLoad("Atualizando Abastecimento [HORA TRABALHADA PESSOA]");

      var lista = data["hora_trabalhada_pessoa"];
      if (!lista || !lista.length) {
        return;
      }

      var ids = lista.map((x) => x.lanca_diario_prod_id);
      var sql = `SELECT id, codigo_intermediario FROM controle_diario WHERE codigo_intermediario IN(${ids.join(
        ","
      )});`;
      var resultado = await banco.executa(sql);
      var listaCDs = Array.from(resultado.rows);

      var sqlInsert = null;
      for (var i = 0; i < lista.length; i++) {
        var object = lista[i];

        var cd = listaCDs.find(
          (cd) =>
            parseInt(cd.codigo_intermediario) ===
            parseInt(object.lanca_diario_prod_id)
        );
        if (cd) {
          var idPai = cd.id;
          if (!sqlInsert) {
            sqlInsert =
              "INSERT INTO `hora_trabalhada_pessoa` (controle_diario,horaR,horaO,codigo_diario_bordo,numero_pessoa,sync,codigo_intermediario) VALUES ";
          }

          sqlInsert += `(${_trataBind(idPai)}, ${_trataBind(
            object.hora_registro
          )}, ${_trataBind(object.hora_informada)}, ${_trataBind(
            object.codigo_diario_bordo_id
          )}, ${_trataBind(object.numero_pessoa)}, 1, ${_trataBind(
            object.id
          )}),`;
        }
      }

      if (sqlInsert) {
        sqlInsert = sqlInsert.slice(0, -1) + ";";
        await banco.executa(sqlInsert);
      }
    } catch (ex) {
      _manipulaError("Erro Hora Trabalhada Pessoa", ex, sql);
    }
  };

  var _horaMaquina = async function (data) {
    try {
      _inicioLoad("Atualizando Abastecimento [HORA TRABALHADA MAQUINA]");

      var lista = Array.from(data["hora_trabalhada_maquina"]);
      if (!lista || !lista.length) {
        return;
      }

      var ids = lista.map((x) => parseInt(x.lanca_diario_prod_id));
      var sql = `SELECT id, codigo_intermediario FROM controle_diario WHERE codigo_intermediario IN(${ids.join(
        ","
      )});`;

      var resultado = await banco.executa(sql);
      var controlesDiarios = Array.from(resultado.rows);

      var sqlInsert = null;

      for (var i = 0; i < lista.length; i++) {
        var object = lista[i];

        var controleDiario = controlesDiarios.find(
          (x) =>
            parseInt(x.codigo_intermediario) &&
            parseInt(x.codigo_intermediario) ===
            parseInt(object.lanca_diario_prod_id)
        );
        if (!controleDiario) {
          continue;
        }

        var idPai = controleDiario.id;

        if (!sqlInsert) {
          sqlInsert =
            "INSERT INTO hora_trabalhada_maquina (controle_diario,data,hora,horaR,codigo_diario_bordo,turno,maquina,horimetro,area_realizada,sync,codigo_intermediario) VALUES ";
        }

        sqlInsert += `(${idPai},${_trataBind(object.data)},${_trataBind(
          object.hora
        )},${_trataBind(object.hora_registro)},${_trataBind(
          object.codigo_diario_bordo_id
        )},${_trataBind(object.turno_id)}, ${_trataBind(
          object.maquina_id
        )}, ${_trataBind(object.horimetro)},${_trataBind(
          object.area_realizada
        )},1,${object.id}),`;
      }

      if (sqlInsert) {
        sqlInsert = sqlInsert.slice(0, -1) + ";";
        await banco.executa(sqlInsert);
      }

      await horaTrabalhadaMaquinaPlaca(data);
      await horaTrabalhadaMaquinaSortimento(data);
      await horaTrabalhadaMaquinaCiclo(data);
    } catch (ex) {
      _manipulaError(
        "Erro ao atualizar Hora Trabalhada Máquina",
        ex,
        sqlInsert
      );
    }
  };

  //////////////////////// DADOS BÁSICOS //////////////////////

  var _preparaParaEnvio = async function (tipoEnviar) {
    try {
      $scope.sicronizando = true;
      $scope.dados = new Object();

      if (tipoEnviar) {
        _inicioLoad("Preparando Dados");

        var sql =
          "SELECT hm.*,cd.codigo_intermediario as idPai FROM hora_trabalhada_maquina hm \n\
                inner join controle_diario cd on cd.id = hm.controle_diario\n\
                WHERE hm.sync = 0 and cd.erro = 0 and cd.modulo = 2";
        var resultado = await banco.executa(sql);
        $scope.dados.controleDiarioCabecalho = Array.from(resultado.rows);

        if ($scope.dados.controleDiarioCabecalho.length > 0) {
          var sql =
            "UPDATE hora_trabalhada_maquina SET enviado = ? WHERE id = ?";
          for (
            let i = 0;
            i < $scope.dados.controleDiarioCabecalho.length;
            i = i + 1
          ) {
            var params = [1, $scope.dados.controleDiarioCabecalho[i].id];
            await banco.executa(sql, params);
          }
        }

        var sql =
          "SELECT cdg.* FROM controle_diario_grupo cdg \n\
                inner join controle_diario cd on cd.controle_diario_grupo = cdg.id \n\
                WHERE (cdg.sync = 0 or cdg.sync is null) and cd.erro = 0 group by cdg.id";
        var resultado = await banco.executa(sql);
        $scope.dados.controleDiarioCabecalho = Array.from(resultado.rows);

        if ($scope.dados.controleDiarioCabecalho.length > 0) {
          var sql = "UPDATE controle_diario_grupo SET enviado = ? WHERE id = ?";
          for (
            let i = 0;
            i < $scope.dados.controleDiarioCabecalho.length;
            i = i + 1
          ) {
            var params = [1, $scope.dados.controleDiarioCabecalho[i].id];
            await banco.executa(sql, params);
          }
        }

        var sql = "SELECT * FROM controle_diario_grupo WHERE finalizado = 1";
        var resultado = await banco.executa(sql);
        $scope.dados.controleDiarioCabecalhoFinalizado = Array.from(
          resultado.rows
        );

        if ($scope.dados.controleDiarioCabecalhoFinalizado.length > 0) {
          var sql = "UPDATE controle_diario_grupo SET enviado = ? WHERE id = ?";
          for (
            let i = 0;
            i < $scope.dados.controleDiarioCabecalhoFinalizado.length;
            i = i + 1
          ) {
            var params = [
              1,
              $scope.dados.controleDiarioCabecalhoFinalizado[i].id,
            ];
            await banco.executa(sql, params);
          }
        }

        /* Colheita */

        //colheita
        var sqlCol = `SELECT 
              cd.*,
              cg.codigo_intermediario as idPai, cg.random as randomPai 
            FROM 
              controle_diario cd 
                LEFT JOIN controle_diario_grupo cg ON cg.id = cd.controle_diario_grupo 
            WHERE 
              (cd.sync = 0 or cd.sync is null) AND 
              cd.erro = 0 AND 
              cd.modulo = 2`;

        var resultado = await banco.executa(sqlCol);
        $scope.dados.controleDiarioColheita = Array.from(resultado.rows);

        if ($scope.dados.controleDiarioColheita.length > 0) {
          var sql = "UPDATE controle_diario SET enviado = ? WHERE id = ?";
          for (
            let i = 0;
            i < $scope.dados.controleDiarioColheita.length;
            i = i + 1
          ) {
            var params = [1, $scope.dados.controleDiarioColheita[i].id];
            await banco.executa(sql, params);
          }
        }

        //colheita
        var sqlComp =
          "SELECT cc.*,cd.codigo_intermediario as idPai, cd.data as dataPai, cd.fazenda, cd.random as randomPai FROM controle_diario_componente cc inner join controle_diario cd on cd.id = cc.controle_diario_id WHERE cc.sync = 0 and cd.erro = 0 and cd.modulo = 2 ";
        var resultado = await banco.executa(sqlComp);
        $scope.dados.controleDiarioComponenteColheita = Array.from(
          resultado.rows
        );

        if ($scope.dados.controleDiarioComponenteColheita.length > 0) {
          var sql =
            "UPDATE controle_diario_componente SET enviado = ? WHERE id = ?";
          for (
            let i = 0;
            i < $scope.dados.controleDiarioComponenteColheita.length;
            i = i + 1
          ) {
            console.log(
              "index",
              $scope.dados.controleDiarioComponenteColheita[i].id
            );
            var params = [
              1,
              $scope.dados.controleDiarioComponenteColheita[i].id,
            ];
            await banco.executa(sql, params);
          }
        }

        //colheita
        sqlFt =
          "SELECT ft.*,cd.codigo_intermediario as idPai, cd.data as dataPai, cd.fazenda FROM controle_diario_foto ft inner join controle_diario cd on cd.id = ft.controle_diario WHERE ft.sync = 0 and cd.erro = 0 and cd.modulo = 2 ";
        var resultado = await banco.executa(sqlFt);
        $scope.dados.controleDiarioFotoColheita = Array.from(resultado.rows);

        if ($scope.dados.controleDiarioFotoColheita.length > 0) {
          var sql = "UPDATE controle_diario_foto SET enviado = ? WHERE id = ?";
          for (
            let i = 0;
            i < $scope.dados.controleDiarioFotoColheita.length;
            i = i + 1
          ) {
            var params = [1, $scope.dados.controleDiarioFotoColheita[i].id];
            await banco.executa(sql, params);
          }
        }

        //colheita
        var sqlIns =
          "SELECT ci.*,cd.codigo_intermediario as idPai, cd.data as dataPai, cd.fazenda FROM controle_diario_insumo ci inner join controle_diario cd on cd.id = ci.controle_diario_id WHERE ci.sync = 0 and cd.erro = 0 and cd.modulo = 2 ";
        var resultado = await banco.executa(sqlIns);
        $scope.dados.controleDiarioInsumoColheita = Array.from(resultado.rows);

        if ($scope.dados.controleDiarioInsumoColheita.length > 0) {
          var sql =
            "UPDATE controle_diario_insumo SET enviado = ? WHERE id = ?";
          for (
            let i = 0;
            i < $scope.dados.controleDiarioInsumoColheita.length;
            i = i + 1
          ) {
            var params = [1, $scope.dados.controleDiarioInsumoColheita[i].id];
            await banco.executa(sql, params);
          }
        }

        //colheita
        var sqlHm = `SELECT 
                        hm.*,
                        hme.hora_trabalhada_maquina, hme.id as idEnc, hme.regiao, hme.talhao as talhaoEnc, hme.operacao, hme.dia, hme.num_arvores,
                        cd.codigo_intermediario as idPai, cd.data as dataPai, cd.fazenda, cd.random as randomPai,cd.operacoes_os_silvicultura as operacaoSilviPai
                    FROM 
                        hora_trabalhada_maquina hm 
                            INNER JOIN controle_diario cd ON cd.id = hm.controle_diario 
                            LEFT JOIN hora_trabalhada_maquina_encarregado hme ON hme.hora_trabalhada_maquina = hm.id
                    WHERE 
                        hm.sync = 0 AND 
                        cd.erro = 0 AND 
                        cd.modulo = 2
                    GROUP BY hm.id`;

        var resultado = await banco.executa(sqlHm);
        $scope.dados.horaTrabalhadaMaquinaColheita = Array.from(resultado.rows);

        if ($scope.dados.horaTrabalhadaMaquinaColheita.length > 0) {
          var sql =
            "UPDATE hora_trabalhada_maquina SET enviado = ? WHERE id = ?";
          for (
            let i = 0;
            i < $scope.dados.horaTrabalhadaMaquinaColheita.length;
            i = i + 1
          ) {
            var params = [1, $scope.dados.horaTrabalhadaMaquinaColheita[i].id];
            await banco.executa(sql, params);
          }
        }

        //colheita
        var sqlFn =
          "SELECT * FROM controle_diario  WHERE finalizado = 1 and modulo = 2";
        var resultado = await banco.executa(sqlFn);
        $scope.dados.controleDiarioFinalizadoColheita = Array.from(
          resultado.rows
        );

        if ($scope.dados.controleDiarioFinalizadoColheita.length > 0) {
          var sql = "UPDATE controle_diario SET enviado = ? WHERE id = ?";
          for (
            let i = 0;
            i < $scope.dados.controleDiarioFinalizadoColheita.length;
            i = i + 1
          ) {
            var params = [
              1,
              $scope.dados.controleDiarioFinalizadoColheita[i].id,
            ];
            await banco.executa(sql, params);
          }
        }

        /*silvicultura*/
        /*var sql = `SELECT cd.*,cg.codigo_intermediario as idPai,
                            (select sum(hm.area_realizada) from hora_trabalhada_maquina hm
                            where hm.controle_diario = cd.id) as areaHm,
                            (select sum(hp.area_realizada) from hora_trabalhada_pessoa hp
                            where hp.controle_diario = cd.id) as areaHp   
                           FROM controle_diario cd 
                           inner join controle_diario_grupo cg on cg.id = cd.controle_diario_grupo 
                           WHERE (cd.sync = 0 or cd.sync is null) and cd.erro = 0 and cd.modulo = 1`;
        var resultado = await banco.executa(sql);
        console.log(resultado.rows);
        $scope.dados.controleDiario = Array.from(resultado.rows);

        if ($scope.dados.controleDiario.length > 0) {
          var sql = "UPDATE controle_diario SET enviado = ? WHERE id = ?";
          for (let i = 0; i < $scope.dados.controleDiario.length; i = i + 1) {
            var params = [1, $scope.dados.controleDiario[i].id];
            await banco.executa(sql, params);
          }
        }*/

        //silvicultura
        /*var sql =
          "SELECT cc.*,cd.codigo_intermediario as idPai, cd.data as dataPai, cd.fazenda FROM controle_diario_componente cc inner join controle_diario cd on cd.id = cc.controle_diario_id WHERE cc.sync = 0 and cd.erro = 0 and cd.modulo = 1 ";
        var resultado = await banco.executa(sql);
        $scope.dados.controleDiarioComponente = Array.from(resultado.rows);

        if ($scope.dados.controleDiarioComponente.length > 0) {
          var sql =
            "UPDATE controle_diario_componente SET enviado = ? WHERE id = ?";
          for (
            let i = 0;
            i < $scope.dados.controleDiarioComponente.length;
            i = i + 1
          ) {
            var params = [1, $scope.dados.controleDiarioComponente[i].id];
            await banco.executa(sql, params);
          }
        }*/

        //silvicultura
        /*sql =
          "SELECT ft.*,cd.codigo_intermediario as idPai, cd.data as dataPai, cd.fazenda FROM controle_diario_foto ft inner join controle_diario cd on cd.id = ft.controle_diario WHERE ft.sync = 0 and cd.erro = 0 and cd.modulo = 1 ";
        var resultado = await banco.executa(sql);
        $scope.dados.controleDiarioFoto = Array.from(resultado.rows);

        if ($scope.dados.controleDiarioFoto.length > 0) {
          var sql = "UPDATE controle_diario_foto SET enviado = ? WHERE id = ?";
          for (
            let i = 0;
            i < $scope.dados.controleDiarioFoto.length;
            i = i + 1
          ) {
            var params = [1, $scope.dados.controleDiarioFoto[i].id];
            await banco.executa(sql, params);
          }
        }*/

        //silvicultura
        /*var sql =
          "SELECT ci.*,cd.codigo_intermediario as idPai, cd.data as dataPai, cd.fazenda FROM controle_diario_insumo ci inner join controle_diario cd on cd.id = ci.controle_diario_id WHERE ci.sync = 0 and cd.erro = 0 and cd.modulo = 1 ";
        var resultado = await banco.executa(sql);
        $scope.dados.controleDiarioInsumo = Array.from(resultado.rows);

        if ($scope.dados.controleDiarioInsumo.length > 0) {
          var sql =
            "UPDATE controle_diario_insumo SET enviado = ? WHERE id = ?";
          for (
            let i = 0;
            i < $scope.dados.controleDiarioInsumo.length;
            i = i + 1
          ) {
            var params = [1, $scope.dados.controleDiarioInsumo[i].id];
            await banco.executa(sql, params);
          }
        }*/

        $scope.dados.controleDiarioPlantio = [];
        var sql =
          "SELECT cp.*,cd.codigo_intermediario as idPai, cd.data as dataPai, cd.fazenda FROM controle_diario_plantio cp INNER JOIN controle_diario cd ON cd.id = cp.controle_diario_id WHERE cp.sync = 0 AND cd.erro = 0 and cd.modulo = 1";
        var resultado = await banco.executa(sql);
        $scope.dados.controleDiarioPlantio = Array.from(resultado.rows);

        if ($scope.dados.controleDiarioPlantio.length > 0) {
          var sql =
            "UPDATE controle_diario_plantio SET enviado = ? WHERE id = ?";
          for (
            let i = 0;
            i < $scope.dados.controleDiarioPlantio.length;
            i = i + 1
          ) {
            var params = [1, $scope.dados.controleDiarioPlantio[i].id];
            await banco.executa(sql, params);
          }
        }

        //silvicultra
        /*var sql =
          "SELECT hm.*,cd.codigo_intermediario as idPai, cd.data as dataPai, cd.fazenda FROM hora_trabalhada_maquina hm inner join controle_diario cd on cd.id = hm.controle_diario WHERE hm.sync = 0 and cd.erro = 0 and cd.modulo = 1";
        var resultado = await banco.executa(sql);
        $scope.dados.horaTrabalhadaMaquina = Array.from(resultado.rows);

        if ($scope.dados.horaTrabalhadaMaquina.length > 0) {
          var sql =
            "UPDATE hora_trabalhada_maquina SET enviado = ? WHERE id = ?";
          for (
            let i = 0;
            i < $scope.dados.horaTrabalhadaMaquina.length;
            i = i + 1
          ) {
            var params = [1, $scope.dados.horaTrabalhadaMaquina[i].id];
            await banco.executa(sql, params);
          }
        }*/

        

        var sql =
          "SELECT hp.*,cd.codigo_intermediario as idPai, cd.data as dataPai, cd.fazenda FROM hora_trabalhada_maquina_placa hp  inner join hora_trabalhada_maquina hm on hm.id = hp.hora_trabalhada_maquina inner join controle_diario cd on cd.id = hm.controle_diario WHERE hp.sync = 0 and cd.erro = 0 and cd.modulo = 1";
        var resultado = await banco.executa(sql);
        $scope.dados.horaTrabalhadaMaquinaPlaca = Array.from(resultado.rows);

        sql = `SELECT hc.*,cd.codigo_intermediario as idPai, cd.data as dataPai, cd.fazenda, hm.random as randomPai FROM lancamento_serra_sabre hc inner join hora_trabalhada_maquina hm on hm.id = hc.hora_maquina_id inner join controle_diario cd on cd.id = hm.controle_diario WHERE hc.sync = 0 and cd.erro = 0`;
        resultado = await banco.executa(sql);
        $scope.dados.manutSerraSabre = Array.from(resultado.rows);

        sql = `SELECT hc.*,cd.codigo_intermediario as idPai, cd.data as dataPai, cd.fazenda, hm.random as randomPai FROM solicitacao_material hc inner join hora_trabalhada_maquina hm on hm.id = hc.hora_maquina_id inner join controle_diario cd on cd.id = hm.controle_diario WHERE hc.sync = 0  and cd.erro = 0`;
        resultado = await banco.executa(sql);
        var lista = Array.from(resultado.rows);
        var solicitacoes = [];
        for (var i = 0; i < lista.length; i++) {
            var item = lista[i];
            var solicit = JSON.parse(item.json);
            solicit.id = item.id;
            solicit.idPai = item.idPai;
            solicit.dataPai = item.dataPai;
            solicit.fazenda = item.fazenda;
            solicit.randomPai = item.randomPai;
            solicit.hora_maquina_id = item.hora_maquina_id;
            solicitacoes.push(solicit);
        } 

        $scope.dados.solicitacaoMaterial = solicitacoes;

        if ($scope.dados.horaTrabalhadaMaquinaPlaca.length > 0) { 
          var sql =
            "UPDATE hora_trabalhada_maquina_placa SET enviado = ? WHERE id = ?";
          for (
            let i = 0;
            i < $scope.dados.horaTrabalhadaMaquinaPlaca.length;
            i = i + 1
          ) {
            var params = [1, $scope.dados.horaTrabalhadaMaquinaPlaca[i].id];
            await banco.executa(sql, params);
          }
        }

        var sql =
          "SELECT hc.*,cd.codigo_intermediario as idPai, cd.data as dataPai, cd.fazenda FROM hora_trabalhada_maquina_ciclo hc inner join hora_trabalhada_maquina hm on hm.id = hc.hora_trabalhada_maquina inner join controle_diario cd on cd.id = hm.controle_diario WHERE hc.sync = 0 and cd.erro = 0";
        var resultado = await banco.executa(sql);
        $scope.dados.horaTrabalhadaMaquinaCiclo = Array.from(resultado.rows);

        if ($scope.dados.horaTrabalhadaMaquinaCiclo.length > 0) {
          var sql =
            "UPDATE hora_trabalhada_maquina_ciclo SET enviado = ? WHERE id = ?";
          for (
            let i = 0;
            i < $scope.dados.horaTrabalhadaMaquinaCiclo.length;
            i = i + 1
          ) {
            var params = [1, $scope.dados.horaTrabalhadaMaquinaCiclo[i].id];
            await banco.executa(sql, params);
          }
        }

        var sql =
          "SELECT hc.*,ci.random as randomPai FROM hora_trabalhada_maquina_ciclo_comp hc inner join hora_trabalhada_maquina_ciclo ci on ci.id = hc.hora_trabalhada_maquina_ciclo inner join hora_trabalhada_maquina hm on hm.id = ci.hora_trabalhada_maquina inner join controle_diario cd on cd.id = hm.controle_diario WHERE hc.sync = 0 and cd.erro = 0";
        var resultado = await banco.executa(sql);
        $scope.dados.horaTrabalhadaMaquinaCicloComp = Array.from(resultado.rows);

        if ($scope.dados.horaTrabalhadaMaquinaCicloComp.length > 0) {
          var sql =
            "UPDATE hora_trabalhada_maquina_ciclo_comp SET enviado = ? WHERE id = ?";
          for (
            let i = 0;
            i < $scope.dados.horaTrabalhadaMaquinaCicloComp.length;
            i = i + 1
          ) {
            var params = [1, $scope.dados.horaTrabalhadaMaquinaCicloComp[i].id];
            await banco.executa(sql, params);
          }
        }


        /*sql = `SELECT hp.*,cd.codigo_intermediario as idPai, cd.data as dataPai, cd.fazenda,hm.random as randomPai 
            FROM hora_trabalhada_maquina_coordenadas hp 
            inner join hora_trabalhada_maquina hm on hm.id = hp.hora_trabalhada_maquina 
            inner join controle_diario cd on cd.id = hm.controle_diario 
            WHERE hp.sync = 0 and cd.erro = 0`;
        resultado = await banco.executa(sql);
        console.log(resultado.rows);
        $scope.dados.horaTrabalhadaMaquinaCoordendada = Array.from(resultado.rows);
        if ($scope.dados.horaTrabalhadaMaquinaCoordendada.length > 0) {
          var sql =
            "UPDATE hora_trabalhada_maquina_coordenadas SET enviado = ? WHERE id = ?";
          for (
            let i = 0;
            i < $scope.dados.horaTrabalhadaMaquinaCoordendada.length;
            i = i + 1
          ) {
            var params = [1, $scope.dados.horaTrabalhadaMaquinaCoordendada[i].id];
            await banco.executa(sql, params);
          }
        }*/
        var sql = `SELECT 
                hs.id, '' as idEnc, hs.hora_trabalhada_maquina, hs.material, hs.medida, hs.quantidade, hs.placa, hs.numero_guia, hs.codigo_intermediario, hs.random, hs.enviado,
                cd.codigo_intermediario as idPai, cd.data as dataPai, cd.fazenda, hm.random as randomPai, hs.inicio, hs.fim, hs.cliente 
            FROM 
                hora_trabalhada_maquina_sortimento hs 
                    INNER JOIN hora_trabalhada_maquina hm ON hm.id = hs.hora_trabalhada_maquina 
                    INNER JOIN controle_diario cd ON cd.id = hm.controle_diario 
            WHERE 
                hs.sync = 0 AND 
                cd.erro = 0
            UNION ALL
            SELECT 
                '' as id, hs.id as idEnc, h.hora_trabalhada_maquina, '' as material, hs.medida, hs.num_cargas as quantidade, '' as placa, '' as numero_guia, '' as codigo_intermediario, hs.random, hs.enviado,
                cd.codigo_intermediario as idPai, cd.data as dataPai, cd.fazenda, h.random as randomPai, '' as inicio, '' as fim, '' as cliente
            FROM 
                hora_trabalhada_maquina_encarregado h
                    INNER JOIN hora_trabalhada_maquina_encarregado_sortimento hs ON h.id = hs.hora_trabalhada_maquina_encarregado 
                    INNER JOIN hora_trabalhada_maquina hm ON hm.id = h.hora_trabalhada_maquina 
                    INNER JOIN controle_diario cd ON cd.id = hm.controle_diario 
            WHERE 
                hs.sync = 0 AND 
                cd.erro = 0`;

        var resultado = await banco.executa(sql);
        $scope.dados.horaTrabalhadaMaquinaSortimento = Array.from(
          resultado.rows
        );

        if ($scope.dados.horaTrabalhadaMaquinaSortimento.length > 0) {
          var sql =
            "UPDATE hora_trabalhada_maquina_sortimento SET enviado = ? WHERE id = ?";
          for (
            let i = 0;
            i < $scope.dados.horaTrabalhadaMaquinaSortimento.length;
            i = i + 1
          ) {
            var params = [
              1,
              $scope.dados.horaTrabalhadaMaquinaSortimento[i].id,
            ];
            await banco.executa(sql, params);
          }
        }

        /*var sql =
          "SELECT hp.*,cd.codigo_intermediario as idPai,cg.id as idMaster, cd.data as dataPai, cd.fazenda FROM hora_trabalhada_pessoa hp  inner join controle_diario cd on cd.id = hp.controle_diario inner join controle_diario_grupo cg on cg.id = cd.controle_diario_grupo where hp.sync = 0 and cd.erro = 0";
        var resultado = await banco.executa(sql);
        $scope.dados.horaTrabalhadaPessoa = Array.from(resultado.rows);

        if ($scope.dados.horaTrabalhadaPessoa.length > 0) {
          var sql =
            "UPDATE hora_trabalhada_pessoa SET enviado = ? WHERE id = ?";
          for (
            let i = 0;
            i < $scope.dados.horaTrabalhadaPessoa.length;
            i = i + 1
          ) {
            var params = [1, $scope.dados.horaTrabalhadaPessoa[i].id];
            await banco.executa(sql, params);
          }
        }*/

        var sql = "SELECT * FROM transporte WHERE sync = 0";
        var resultado = await banco.executa(sql);
        $scope.dados.transporte = Array.from(resultado.rows);

        var sql = "SELECT * FROM transporte_funcionario WHERE sync = 0";
        var resultado = await banco.executa(sql);
        $scope.dados.transporteFuncionario = Array.from(resultado.rows);

        var sql = "SELECT * FROM abastecimento WHERE sync = 0";
        var resultado = await banco.executa(sql);
        $scope.dados.abastecimento = Array.from(resultado.rows);

        //silvicultura
        /*var sql =
          "SELECT * FROM controle_diario  WHERE finalizado = 1 and modulo = 1";
        var resultado = await banco.executa(sql);
        $scope.dados.controleDiarioFinalizado = Array.from(resultado.rows);

        if ($scope.dados.controleDiarioFinalizado.length > 0) {
          var sql = "UPDATE controle_diario SET enviado = ? WHERE id = ?";
          for (
            let i = 0;
            i < $scope.dados.controleDiarioFinalizado.length;
            i = i + 1
          ) {
            var params = [1, $scope.dados.controleDiarioFinalizado[i].id];
            await banco.executa(sql, params);
          }
        }*/

        /*var sql = "SELECT * FROM abastecimento_material WHERE sync = 0";
        var resultado = await banco.executa(sql);
        $scope.dados.abastecimentoMaterial = Array.from(resultado.rows);

        var sql = "SELECT * FROM afericao WHERE sync = 0";
        var resultado = await banco.executa(sql);
        $scope.dados.afericao = Array.from(resultado.rows);

        var sql = "SELECT * FROM medicao WHERE sync = 0";
        var resultado = await banco.executa(sql);
        $scope.dados.medicao = Array.from(resultado.rows);

        var sql = "SELECT * FROM encerrante WHERE sync = 0";
        var resultado = await banco.executa(sql);
        $scope.dados.encerrante = Array.from(resultado.rows);

        var sql = "SELECT * FROM drenagem WHERE sync = 0";
        var resultado = await banco.executa(sql);
        $scope.dados.drenagem = Array.from(resultado.rows);

        var sql = "SELECT * FROM troca_elemento_filtrante WHERE sync = 0";
        var resultado = await banco.executa(sql);
        $scope.dados.trocaElementoFiltrante = Array.from(resultado.rows);

        var sql = "SELECT * FROM lubrificacao WHERE sync = 0";
        var resultado = await banco.executa(sql);
        $scope.dados.lubrificacao = Array.from(resultado.rows);

        var sql = "SELECT * FROM lubrificacao_itens WHERE sync = 0";
        var resultado = await banco.executa(sql);
        $scope.dados.lubrificacaoItens = Array.from(resultado.rows);

        var sql = "SELECT * FROM graxa WHERE sync = 0";
        var resultado = await banco.executa(sql);
        $scope.dados.consumoGraxa = Array.from(resultado.rows);

        var sql = "SELECT * FROM apontamento_material WHERE sync = 0";
        var resultado = await banco.executa(sql);
        $scope.dados.apontamentoMaterial = Array.from(resultado.rows);

        var sql = "SELECT * FROM apontar_mecanico WHERE sync = 0";
        var resultado = await banco.executa(sql);
        $scope.dados.apontarMecanico = Array.from(resultado.rows);

        var sql = "SELECT * FROM apontar_mecanico_sem_os WHERE sync = 0";
        var resultado = await banco.executa(sql);
        $scope.dados.apontarMecanicoSemOs = Array.from(resultado.rows);

        var sql = "SELECT * FROM box WHERE sync = 0";
        var resultado = await banco.executa(sql);
        $scope.dados.box = Array.from(resultado.rows);

        var sql = "SELECT * FROM descarga WHERE sync = 0";
        var resultado = await banco.executa(sql);
        $scope.dados.descarga = Array.from(resultado.rows);

        var sql = "SELECT * FROM descarga_funcionario WHERE sync = 0";
        var resultado = await banco.executa(sql);
        $scope.dados.descargaFuncionario = Array.from(resultado.rows);*/

        /*var sql = "SELECT * FROM parada WHERE sync = 0";
        var resultado = await banco.executa(sql);
        $scope.dados.parada = Array.from(resultado.rows);*/

        /*var sql = "SELECT * FROM enfornamento WHERE sync = 0";
        var resultado = await banco.executa(sql);
        $scope.dados.enfornamento = Array.from(resultado.rows);

        var sql = "SELECT * FROM enfornamento_funcionario WHERE sync = 0";
        var resultado = await banco.executa(sql);
        $scope.dados.enfornamentoFuncionario = Array.from(resultado.rows);

        var sql = "SELECT * FROM os WHERE sync = 0";
        var resultado = await banco.executa(sql);
        $scope.dados.os = Array.from(resultado.rows);

        var sql = "SELECT * FROM os_foto WHERE sync = 0";
        var resultado = await banco.executa(sql);
        $scope.dados.osFotos = Array.from(resultado.rows);

        var sql = "SELECT * FROM os_servico WHERE sync = 0";
        var resultado = await banco.executa(sql);
        $scope.dados.osServico = Array.from(resultado.rows);

        var sql = "SELECT * FROM expedicao WHERE sync = 0";
        var resultado = await banco.executa(sql);
        $scope.dados.expedicao = Array.from(resultado.rows);*/

        var sql = "SELECT * FROM lancamento WHERE sync = 0";
        var resultado = await banco.executa(sql);
        $scope.dados.lancamento = Array.from(resultado.rows);

        var sql = "SELECT * FROM materiais_insumos WHERE sync = 0";
        var resultado = await banco.executa(sql);
        $scope.dados.materiaisInsumos = Array.from(resultado.rows);

        /* var sql = "SELECT * FROM altura WHERE sync = 0";
         var resultado = await banco.executa(sql);
         $scope.dados.alturas = Array.from(resultado.rows);*/

        var sql = "SELECT * FROM ponto_abastecimento WHERE sync = 0";
        var resultado = await banco.executa(sql);
        $scope.dados.pontoAbastecimento = Array.from(resultado.rows);

        var sql =
          "SELECT * FROM checklist_operacao WHERE sync = 0 OR sync IS NULL";
        var resultado = await banco.executa(sql);

        var lista = Array.from(resultado.rows);
        var checklists = [];
        for (var i = 0; i < lista.length; i++) {
          var item = lista[i];
          var checklist = JSON.parse(item.json);
          console.log(checklist,'checklist');
          var data = new Date(item.data);
          var day = data.getDate();
          var mon = parseInt(data.getMonth()) + 1;
          var mon = mon < 10 ? "0" + mon : mon;
          var yea = data.getFullYear();
          var data = yea + "/" + mon + "/" + day;

          checklist.id = item.id;
          checklist.data = data;
          checklist.operador = item.operador_id;
          checklist.modulo = item.modulo;
          checklist.random = item.random;
          checklists.push(checklist);

          var sql = "UPDATE checklist_operacao SET enviado = ? WHERE id = ?";
          var params = [1, item.id];
          await banco.executa(sql, params);
        }

        $scope.dados.checklistOperacoes = checklists;

        var sql =
          "SELECT * FROM solicitacao_manutencao WHERE sync = 0 OR sync IS NULL";
        var resultado = await banco.executa(sql);

        var lista = Array.from(resultado.rows);
        var solicitacoes = [];
        for (var i = 0; i < lista.length; i++) {
          var item = lista[i];
          var solicitacao = JSON.parse(item.json);
          solicitacao.id = item.id;
          solicitacao.data = new Date(item.data);
          solicitacao.tipo = 1;
          solicitacao.dataAvaria = new Date(solicitacao.dataAvaria);
          solicitacao.modulo = item.modulo;
          solicitacao.randomPai = String(solicitacao.randomPai);
          solicitacoes.push(solicitacao);

          var sql =
            "UPDATE solicitacao_manutencao SET enviado = ? WHERE id = ?";
          var params = [1, item.id];
          await banco.executa(sql, params);
        }

        $scope.dados.solicitacoesManutencoes = solicitacoes;
      }

      $scope.dados.mobileID = device.uuid;
      $scope.dados.matricula = "";
      var sql = "SELECT * FROM 'matricula'";
      var resultado = await banco.executa(sql);
      var lista = Array.from(resultado.rows);
      if (lista.length) {
        $scope.dados.matricula = lista[lista.length - 1].row;
      }

      $scope.dados.usuario = "";
      $scope.dados.usuarioId = "";
      $scope.dados.senha = "";
      var sql = "SELECT * FROM 'usuario'";
      var resultado = await banco.executa(sql);
      var lista = Array.from(resultado.rows);
      if (lista.length) {
        var usuario = lista[lista.length - 1];
        $scope.dados.usuario = usuario.nome;
        $scope.dados.senha = usuario.senha;
        $scope.dados.usuarioId = usuario.id;
      }

      $scope.dados.ip = "";
      var sql = "SELECT * FROM 'config_ip'";
      var resultado = await banco.executa(sql);
      var lista = Array.from(resultado.rows);
      console.log(lista);
      if (lista.length) {
        $scope.dados.ip = lista[lista.length - 1].ip;
        $scope.porta443 = lista[lista.length - 1].porta === 443;
      }

      $scope.dados.aparelho = device.uuid;
      $scope.dados.versao = $scope.versao;
    } catch (ex) {
      _manipulaError("Erro ao capturar dados do banco de dados!", ex);
    }
  };

  var _criarTabelasDadosBasicos = async function () {
    try {
      _inicioLoad("Atualizando Tabelas...");

      await banco.executa("DROP TABLE IF EXISTS talhao");
      await banco.executa(
        "CREATE TABLE IF NOT EXISTS talhao (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `nome` TEXT, `projeto_estrutural_id` INTERGER, `especie_id` INTERGER);"
      );

      await banco.executa("DROP TABLE IF EXISTS projeto_estrutural");
      await banco.executa(
        "CREATE TABLE IF NOT EXISTS projeto_estrutural (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `nome` TEXT, `fazenda_id` INTERGER);"
      );

      await banco.executa("DROP TABLE IF EXISTS fornecedor");
      await banco.executa(
        "CREATE TABLE IF NOT EXISTS fornecedor (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `nome` TEXT);"
      );

      await banco.executa("DROP TABLE IF EXISTS serra_sabre");
      await banco.executa(
        "CREATE TABLE IF NOT EXISTS serra_sabre (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `descricao` TEXT, `tipo` INTEGER);"
      );

      await banco.executa("DROP TABLE IF EXISTS usuario_fornecedor");
      await banco.executa(
        "CREATE TABLE IF NOT EXISTS usuario_fornecedor (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `usuario` INTEGER, `fornecedor` INTEGER);"
      );

      await banco.executa("DELETE FROM configuracao WHERE id >= 1;");
      await banco.executa(
        'DELETE FROM sqlite_sequence WHERE name="configuracao";'
      );

      await banco.executa("DELETE FROM insumo WHERE id >= 1;");
      await banco.executa('DELETE FROM sqlite_sequence WHERE name="insumo";');

      await banco.executa("DELETE FROM material_genetico WHERE id >= 1;");
      await banco.executa(
        'DELETE FROM sqlite_sequence WHERE name="material_genetico";'
      );

      await banco.executa("DELETE FROM checklist WHERE id >= 1;");
      await banco.executa(
        'DELETE FROM sqlite_sequence WHERE name="checklist";'
      );

      await banco.executa("DELETE FROM unidade_medida WHERE id >= 1;");
      await banco.executa("DELETE FROM componente WHERE id >= 1;");
      await banco.executa("DELETE FROM empresa WHERE id >= 1;");
      await banco.executa("DELETE FROM funcionario WHERE id >= 1;");      
      await banco.executa("DELETE FROM operacao WHERE id >= 1;");
      await banco.executa("DELETE FROM compor_operacao WHERE id >= 1;");
      await banco.executa("DELETE FROM operacao_colheita WHERE id >= 1;");
      await banco.executa("DELETE FROM projeto_execucao WHERE id >= 1;");
      await banco.executa("DELETE FROM placa WHERE id >= 1;");
      await banco.executa("DELETE FROM cliente WHERE id >= 1;");
      await banco.executa("DELETE FROM compartimento WHERE id >= 1;");
      await banco.executa("DELETE FROM fazenda WHERE id >= 1;");
      await banco.executa("DELETE FROM mes_ano WHERE id >= 1;");
      await banco.executa("DELETE FROM oficina WHERE id >= 1;");
      await banco.executa("DELETE FROM operador WHERE id >= 1;");
      await banco.executa("DELETE FROM modelo_patrimonio WHERE id >= 1;");
      await banco.executa("DELETE FROM itens_modelo_patrimonio WHERE id >= 1;");
      await banco.executa("DELETE FROM patrimonio WHERE id >= 1;");
      await banco.executa("DELETE FROM sistemas_do_modelo WHERE id >= 1;");
      await banco.executa("DELETE FROM compartimentos_sistema WHERE id >= 1;");
      await banco.executa("DELETE FROM projeto WHERE id >= 1;");
      await banco.executa("DELETE FROM servico_manutencao WHERE id >= 1;");
      await banco.executa("DELETE FROM turno WHERE id >= 1;");
      await banco.executa("DELETE FROM sistema WHERE id >= 1;");
      await banco.executa("DELETE FROM almoxarifado_material WHERE id >= 1;");
      await banco.executa(
        "DELETE FROM detalhe_talhao_componente WHERE id >= 1;"
      );
      await banco.executa("DELETE FROM detalhe_talhao_operacao WHERE id >= 1;");
      await banco.executa("DELETE FROM lanca_os_silvicultura WHERE id >= 1;");
      await banco.executa(
        "DELETE FROM operacoes_os_silvicultura WHERE id >= 1;"
      );
      await banco.executa("DELETE FROM insumos_os_silvicultura WHERE id >= 1;");
      await banco.executa("DELETE FROM codigo_diario_bordo WHERE id >= 1;");
      await banco.executa("DELETE FROM tipo_operacao WHERE id >= 1;");
      await banco.executa("DELETE FROM diario_bordo WHERE id >= 1;");
      await banco.executa(
        "DELETE FROM diario_bordo_vinc_opcoes WHERE id >= 1;"
      );
      await banco.executa("DELETE FROM operacao_tipo WHERE id >= 1;");
      await banco.executa("DELETE FROM patrimonio_tipo WHERE id >= 1;");
      await banco.executa("DELETE FROM medida WHERE id >= 1;");
      await banco.executa("DELETE FROM material_medida WHERE id >= 1;");
      await banco.executa("DELETE FROM espacamentos WHERE id >= 1;");
      await banco.executa("DELETE FROM permissao WHERE id >= 1;");
      await banco.executa("DELETE FROM prescricao_tecnica WHERE id >= 1;");
      await banco.executa(
        "DELETE FROM insumos_prescricao_tecnica WHERE id >= 1;"
      );
      await banco.executa("DELETE FROM frente_servico WHERE id >= 1;");
      await banco.executa(
        "DELETE FROM detalhe_talhao_operacao_planejado WHERE id >= 1;"
      );
      await banco.executa("DELETE FROM projeto_estrutural WHERE id >= 1;");
      await banco.executa("DELETE FROM fornecedor WHERE id >= 1;");
      await banco.executa("DELETE FROM usuario_fornecedor WHERE id >= 1;");
      await banco.executa("DELETE FROM material_ordem_servico WHERE id >= 1;");
      await banco.executa("DELETE FROM material_lista_tarefas WHERE modeloid >= 1;");
      await banco.executa("DELETE FROM prioridade WHERE id >= 1;");
      await banco.executa("DELETE FROM mecanico WHERE id >= 1;");
      await banco.executa("DELETE FROM material_ordem_servico WHERE id >= 1;");
      await banco.executa('DELETE FROM prioridade WHERE id >= 1;');
      await banco.executa('DELETE FROM etiquetas WHERE id >= 1;');
      await banco.executa('DELETE FROM compartimento_patrimonio WHERE id >= 1;');
      await banco.executa('DELETE FROM rel_compartimento_patrimonio WHERE id >= 1;');
    } catch (ex) {
      _manipulaError(`Erro ao remover dados`, ex, "");
    }
  };

  var _popularSolicitacoesMaterial = async function (output) {
    try {

        var sql = 'DELETE FROM solicitacao_material where sync = 1';
        await banco.executa(sql);


        if (output) {

            output.lancamentoSolicitacaoMateriais = Array.from(output);
            if (output.lancamentoSolicitacaoMateriais.length) {

                var sql = 'INSERT INTO solicitacao_material (id, data_solicitacao, patrimonio_id, mecanico_id, cod_fabricante, foto, json, sync) VALUES';
                for (let i = 0; i < output.lancamentoSolicitacaoMateriais.length; i++) {
                    var material = {};
                    material = output.lancamentoSolicitacaoMateriais[i];
                    let patrimonio = material.patrimonio ? material.patrimonio.id : 0;
                    let mecanico = material.solicitante ? material.solicitante.id : 0;


                    sql += ` (${material.id}, '${material.dataDaSolicitacao}', '${patrimonio}', '${mecanico}', '${material.codfabricante}', '${material.foto}', '${JSON.stringify(material)}', 1),`;

                }
                sql = sql.slice(0, -1) + ';';

                await banco.executa(sql);
            }
        }
    } catch (ex) {
        console.error(ex);
        alert(sql);
        alert('Erro ao inserir Solicitacao de Material');
    }

}

var _popularSolicitacoesManutencao = async function (output) {
  try {

      var sql = 'DELETE FROM solicitacao_manutencao';
      await banco.executa(sql);
      if (output) {

          output.lancamentoSolicitacaoManutencao = Array.from(output);
          if (output.lancamentoSolicitacaoManutencao.length) {

              var sql = 'INSERT INTO solicitacao_manutencao (id, tipo, patrimonio_id, operador_id, data, delphID, sync, updated,json) VALUES';
              for (let i = 0; i < output.lancamentoSolicitacaoManutencao.length; i++) {
                  var solicitacaoManutencao = {};
                  solicitacaoManutencao = output.lancamentoSolicitacaoManutencao[i];
                  let patrimonio = solicitacaoManutencao.patrimonio ? solicitacaoManutencao.patrimonio.id : 0;
                  let operador = solicitacaoManutencao.OPERADOR ? solicitacaoManutencao.OPERADOR.id : 0;
                  let data = new Date(solicitacaoManutencao.data.date).getTime();
                  solicitacaoManutencao.data = data;
                  let hora = new Date(solicitacaoManutencao.hora.date);
                  solicitacaoManutencao.hora = hora;
                  let dataAvaria = new Date(solicitacaoManutencao.dataAvaria.date);
                  solicitacaoManutencao.dataAvaria = dataAvaria;
                  let horaAvaria = new Date(solicitacaoManutencao.horaAvaria.date);
                  solicitacaoManutencao.horaAvaria = horaAvaria;

                  let dataDesejada = new Date(solicitacaoManutencao.dataDesejada.date);
                  solicitacaoManutencao.dataDesejada = dataDesejada;

                  let horaDesejada = new Date(solicitacaoManutencao.horaDesejada.date);
                  solicitacaoManutencao.horaDesejada = horaDesejada;
                  let delphID = solicitacaoManutencao.id;

                  sql += ` (${delphID}, ${solicitacaoManutencao.tipoSolicitacao}, '${patrimonio}', '${operador}', '${data}', '${delphID}', 1, 0 , '${JSON.stringify(solicitacaoManutencao)}'),`;

              }
              sql = sql.slice(0, -1) + ';';

              await banco.executa(sql);
          }
      }

  } catch (ex) {
      _manipulaError('Erro ao inserir Solicitacao Manutencao', ex, sql);
  }

}

var _popularOrdensDeServico = async function (output) {
  try {

      var sql = 'DELETE FROM ordem_de_servico';
      await banco.executa(sql);


      if (output) {

          output.os = Array.from(output);
          if (output.os.length) {
              var sql = 'INSERT INTO ordem_de_servico (id, delphID, data, data_inicio, data_fim, status, patrimonio_id, mecanico_id, tipo_ordem_id, json, sync, updated, numeroSap) VALUES';
              for (let i = 0; i < output.os.length; i++) {
                  var os = {};
                  os = output.os[i];
                  let mecanico = os.mecanico ? os.mecanico.id : 0;
                  let tipoOrdem = os.TipoOrdemServico ? os.TipoOrdemServico.id : 0;
                  let status = os.status ? os.status : 'ABERTA';
                  let dtInicioAvaria = new Date(os.dataInicioAvaria.date).getTime();
                  let dtFimAvaria = null;
                  if (os.dataFimAvaria) {
                      dtFimAvaria = new Date(os.dataFimAvaria.date).getTime();
                  }

                  let data = new Date(os.data.date).getTime();
                  os.data = new Date(os.data.date);
                  os.dataInicioAvaria = new Date(os.dataInicioAvaria.date);
                  if (os.dataFimAvaria) {
                      os.dataFimAvaria = new Date(os.dataFimAvaria.date);
                  } else {
                      os.dataFimAvaria = '';
                  }
                  
                  sql += ` (${os.delphID}, ${os.delphID}, '${data}', '${dtInicioAvaria}', '${dtFimAvaria}', '${status}', ${os.patrimonio.id}, ${mecanico}, ${tipoOrdem}, '${JSON.stringify(os)}', 1, 0,'${os.numeroSap}'),`;

              }
              sql = sql.slice(0, -1) + ';';

              await banco.executa(sql);
          }
      }

  } catch (ex) {
      _manipulaError('Erro ao inserir Ordens de Serviço', ex, sql);
  }

}

  var populaChecklist = async function (checklists) {
    var sqlInsert = null;

    var pedaco = checklists.splice(0, 10);
    console.log(pedaco,'pedaco');
    for (var inicio = 0; inicio < pedaco.length; inicio++) {
      var checklist = {};
      checklist = angular.extend(checklist, pedaco[inicio]);

      if (!sqlInsert) {
        sqlInsert = `INSERT INTO checklist (delphID, tipo, patrimonio_id, json, sync, updated) VALUES `;
      }

      sqlInsert += ` (${parseInt(checklist.delphID)}, ${checklist.tipo}, ${checklist.patrimonio.id
        }, '${JSON.stringify(checklist)}', 0, 0),`;
    }

    if (sqlInsert) {
      sqlInsert = sqlInsert.slice(0, -1) + ";";
      await banco.executa(sqlInsert);
    }

    if (checklists.length) {
      await populaChecklist(checklists);
    }

    return true;
  };

  var _populaDadosBasicos = async function (data, transacao) {
    _inicioLoad("Populando Dados Básicos...");

    try {
      var tabela = "checkListOperacoes";
      console.log(data[tabela],'data[tabela]');
      if (data[tabela]) {
        await populaChecklist(data[tabela]);
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular checklist`, ex, sqlInsert);
    }
    
    try{
      var tabela = "lancamentoSolicitacaoMateriais";
      if (data[tabela]) {
        _popularSolicitacoesMaterial(data[tabela]);
      }
    }catch(ex){
      _manipulaError(`Erro ao solicitação de material`, ex, sqlInsert);
    }

    try{
      var tabela = "lancamentoSolicitacaoManutencao";
      if (data[tabela]) {
        _popularSolicitacoesManutencao(data[tabela]);
      }
    }catch(ex){
      _manipulaError(`Erro ao solicitação de manutencao`, ex, sqlInsert);
    }

    try{
      var tabela = "os";
      if (data[tabela]) {
        _popularOrdensDeServico(data[tabela]); 
      }
    }catch(ex){
      _manipulaError(`Erro ao ordem de serviço`, ex, sqlInsert);
    }

    try {
      var tabela = "mecanicos";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var item = {};
          item = data[tabela][i];
          if (!sqlInsert) {
            sqlInsert = `INSERT INTO mecanico (id, delphID, nome) VALUES `;
          }

          sqlInsert += ` (${item.delphID}, ${item.delphID}, '${item.nome}'),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "etiquetas";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var item = {};
          item = data[tabela][i];
          if (!sqlInsert) {
            sqlInsert = `INSERT INTO etiquetas (id, descricao_falha, desc_detalhada, patrimonio, numero_etiqueta, tipo_etiqueta_desc, status, data_lancamento) VALUES `;
          }

          sqlInsert += ` (${item.COD_INC}, '${item.DESCRICAO_FALHA}', '${item.DESC_DETALHADA}',${item.PATRIMONIO},'${item.NUMERO_ETIQUETA}','${item.TIPO_ETIQUETA_DESC}','${item.STATUS}','${item.DATA_LANCAMENTO}'),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "serra_sabre";
      if (data[tabela]) {
        
        var sqlInsert = null; 

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];
          if (!sqlInsert) {
            sqlInsert = `INSERT INTO serra_sabre (id, descricao, tipo) VALUES `;
          }

          sqlInsert += ` (${object.CODIGO}, '${object.DESCRICAO}','${object.TIPO}'),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "tipoPrioridade";
      if (data[tabela]) {
        
        var sqlInsert = null; 

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];
          prioridade = data[tabela][i];
          prioridade.id = parseInt(prioridade.id);
          prioridade.nome = prioridade.nome;
          prioridade.codigoSAP = prioridade.codigoSAP;
          if (!sqlInsert) {
            sqlInsert = `INSERT INTO prioridade (id, nome, codigosap) VALUES `;
          }

          sqlInsert += ` (${prioridade.id}, '${prioridade.nome}','${prioridade.codigoSAP}'),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "materialListaTarefa";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];
          var item = {};
          item = data[tabela][i];
          if (!sqlInsert) {
            sqlInsert = `INSERT INTO material_lista_tarefas (modeloid, listaid, materialid, quantidade, variacao) VALUES `;
          }

          sqlInsert += ` (${item.modelo},  ${item.listaTarefa}, ${item.material}, ${item.quantidadeIdeal}, ${item.variacaoAceita} ),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "materiais";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];
          var material = {};
          material = data[tabela][i];
          material.id = parseInt(material.id);
          if (!sqlInsert) {
            sqlInsert = `INSERT INTO material_ordem_servico (id,descricao, unidade_id, unidade_nome, quantidade, codfabricante) VALUES `;
          }

          sqlInsert += ` (${material.id},'${material.descricao}', ${material.unidade.delphID}, '${material.unidade.nome}', ${material.quantidade}, ${material.codfabricante}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "usuario_fornecedor";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, usuario,fornecedor) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.usuario_id
          )}, ${_trataBind(object.fornecedor_id)}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "talhao";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, nome, projeto_estrutural_id,especie_id) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}, ${_trataBind(object.projeto_estrutural_id)},${_trataBind(
            object.especie_id
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "material_ordem_servico";
      

      if (data[tabela]) {
        var sql = 'DELETE FROM material_ordem_servico WHERE 1;';
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var material = {};
          material = output.materiais[i];
          material.id = parseInt(material.id);
          sql += ` (${material.id},'${material.descricao}', ${material.unidade.delphID}, '${material.unidade.nome}', ${material.quantidade}, ${material.codfabricante}),`;
        }
        sql = sql.slice(0, -1) + ';';
        await banco.executa(sql);
      }      

    } catch (ex) {
        _manipulaError('Erro ao inserir materiais', ex, sql);
    }


    /* try {
      var tabela = "upc";
      if (data[tabela]) {
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, nome, empresa_id) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}, ${_trataBind(object.empresa_id)}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    } */

    try {
      var tabela = "configuracao";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, possui_funcionarios_carvao,volume_automatico_carvao) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.possui_funcionarios_carvao
          )}, ${_trataBind(object.volume_automatico_carvao)}]),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    /* try {
      var tabela = "config_densidade_descarga";
      if (data[tabela]) {
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, dataIni, dataFim, upc, densidade) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.data_ini
          )}, ${_trataBind(object.data_fim)}, ${_trataBind(
            object.upc_id
          )}, ${_trataBind(object.densidade)}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    } */

    try {
      var tabela = "placa";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, nome, largura, comprimento, upc, tara) VALUES  `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}, ${_trataBind(object.largura)}, ${_trataBind(
            object.comprimento
          )}, ${_trataBind(object.upc_id)}, ${_trataBind(object.tara)}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "projeto_estrutural";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, nome, fazenda_id) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}, ${_trataBind(object.fazenda_id)}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    /* try {
      var tabela = "forno";
      if (data[tabela]) {
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, nome, estado, upc, volume_metro_cubico, volume_metro_estereo, umidade) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}, ${_trataBind(object.estado)}, ${_trataBind(
            object.upc_id
          )}, ${_trataBind(object.volume_metro_cubico)}, ${_trataBind(
            object.volume_metro_estereo
          )}, ${_trataBind(object.umidade)}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    } */

    /* try {
      var tabela = "box_carvao";
      if (data[tabela]) {
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, nome, upc) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}, ${_trataBind(object.upc_id)}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    } */

    /* try {
      var tabela = "box_lenha";
      if (data[tabela]) {
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, nome, talhao_estrada, fator_empilhamento, upc) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}, ${_trataBind(object.talhao_estrada)}, ${_trataBind(
            object.fator_empilhamento
          )}, ${_trataBind(object.upc_id)}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    } */

    /* try {
      var tabela = "tamanho_madeira";
      if (data[tabela]) {
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, nome, tamanho, fator) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}, ${_trataBind(object.tamanho)}, ${_trataBind(
            object.fator_empilhamento
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    } */

    try {
      var tabela = "fornecedor";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, nome) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
      return;
    }

    /* try {
      var tabela = "agente_causador";
      if (data[tabela]) {
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, nome) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    } */

    /* try {
      var tabela = "centro_resultado";
      if (data[tabela]) {
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, nome) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    } */

    try {
      var tabela = "cliente";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, nome) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
      return;
    }

    try {
      var tabela = "compartimento";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, nome) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "componente";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, nome, empresa_main, modulo) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}, ${_trataBind(object.empresa_main)}, ${_trataBind(
            object.modulo
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "empresa";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, nome) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    /* try {
      var tabela = "faixa";
      if (data[tabela]) {
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, nome) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    } */

    try {
      var tabela = "fazenda";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, nome) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "funcionario";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, nome,abastecedor) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}, ${_trataBind(object.abastecedor)}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "insumo";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, nome) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "mes_ano";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, nome) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    /* try {
      var tabela = "motivo_abertura";
      if (data[tabela]) {
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, nome) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    } */

    /* try {
      var tabela = "motivo_parada";
      if (data[tabela]) {
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, nome) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    } */

    /* try {
      var tabela = "motivo_parada_mecanico";
      if (data[tabela]) {
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, nome) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    } */

    try {
      var tabela = "oficina";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, nome) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "operacao";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, nome,empresa_main,tipo_tot_det_id,operacao_plantio,operacao_processo,unidade_id,operacao_encarregado,lista_operacao_encarregado) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}, ${_trataBind(object.empresa_main)}, ${_trataBind(
            object.tipo_tot_det_id
          )}, ${_trataBind(object.operacao_plantio)}, ${_trataBind(
            object.operacao_processo
          )}, ${_trataBind(object.unidade_id)}, ${_trataBind(
            object.operacao_encarregado
          )}, ${_trataBind(object.lista_operacao_encarregado)}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "operacao_colheita";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, nome) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "compor_operacao";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, operacao_id,componente_id,rendimento) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.operacao_id
          )}, ${_trataBind(object.componente_id)}, ${_trataBind(
            object.rendimento
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "patrimonio";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, nome,operacao_colheita_id,modelo_patrimonio_id,ultimo_horimetro,colheita,silvicultura,abastecimento,manutencao) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}, ${_trataBind(object.operacao_colheita_id)}, ${_trataBind(
            object.modelo_patrimonio_id
          )}, ${_trataBind(object.ultimo_horimetro)},${_trataBind(
            object.colheita
          )},${_trataBind(object.silvicultura)},${_trataBind(
            object.abastecimento
          )},${_trataBind(object.manutencao)}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "sistemas_do_modelo";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, modelo_patrimonio_id,sistema_id) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.modelo_patrimonio_id
          )}, ${_trataBind(object.sistema_id)}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "compartimentos_sistema";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, sistemas_do_modelo_id,compartimento_id,participa_troca_remonta,capacidade,lubrificante_ideal_id) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.sistemas_do_modelo_id
          )}, ${_trataBind(object.compartimento_id)}, ${_trataBind(
            object.participa_troca_remonta
          )}, ${_trataBind(object.capacidade)}, ${_trataBind(
            object.lubrificante_ideal_id
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "material_genetico";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, nome) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    /* try {
      var tabela = "classe_recipiente";
      if (data[tabela]) {
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, nome) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    } */

    try {
      var tabela = "operador";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, nome) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "projeto";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, nome) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    /* try {
      var tabela = "movimentacao_abastecimento";
      if (data[tabela]) {
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, nome) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    } */

    try {
      var tabela = "servico_manutencao";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, nome) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    /* try {
      var tabela = "tipo_expedicao";
      if (data[tabela]) {
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, nome) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    } */

    /* try {
      var tabela = "tipo_os";
      if (data[tabela]) {
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, nome) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    } */

    /* try {
      var tabela = "tipo_parada";
      if (data[tabela]) {
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, nome) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    } */

    try {
      var tabela = "unidade_medida";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, nome) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "sistema";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, nome) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    /* try {
      var tabela = "material_filtro";
      if (data[tabela]) {
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, nome) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    } */

    try {
      var tabela = "modelo_patrimonio";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, nome, periodicidade,indice_contaminacao) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}, ${_trataBind(object.periodicidade)}, ${_trataBind(
            object.indice_contaminacao
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "itens_modelo_patrimonio";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, modelo_patrimonio,item_lubrificacao,local_lubrificacao) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.modelo_patrimonio_id
          )}, ${_trataBind(object.item_lubrificacao)}, ${_trataBind(
            object.local_lubrificacao
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "projeto_execucao";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, nome,empresa_main) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}, ${_trataBind(object.empresa_main)}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "turno";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, nome, modulo) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}, ${_trataBind(object.modulo)}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "detalhe_talhao_componente";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (ID, COMPONENTE_ID, DETALHE_TALHAO_OPERACAO_ID,FORNECEDOR_ID, VALOR,PRODUCAO) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.componente_id
          )}, ${_trataBind(object.detalhe_talhao_operacao_id)}, ${_trataBind(
            object.fornecedor_id
          )}, ${_trataBind(object.valor)}, ${_trataBind(object.producao)}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "detalhe_talhao_operacao";
      if (data[tabela]) {
        
        var sqlInsert = null;
        var count = 0;
        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];
          count++;
          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (ID, DATA, OPERACOES_CODIGO, UNIDADE_DESCRICAO, FAZENDA_CODIGO, PROJETO_CODIGO, TALHAO_CODIGO, CICLO_FASE, TOTAL_OPERACAO, CUSTO_HECTARE, AREA, DELETADO) VALUES `;
          }

          var date = new Date(object.DATA);
          date.setDate(date.getDate() + 1);

          sqlInsert += `(${_trataBind(object.ID)}, ${_trataBind(
            date
          )}, ${_trataBind(object.OPERACOES_CODIGO)}, ${_trataBind(
            object.UNIDADE_DESCRICAO
          )}, ${_trataBind(object.FAZENDA_CODIGO)}, ${_trataBind(
            object.PROJETO_CODIGO
          )}, ${_trataBind(object.TALHAO_CODIGO)}, ${_trataBind(
            object.CICLO_FASE
          )}, ${_trataBind(object.TOTAL_OPERACAO)}, ${_trataBind(
            object.CUSTO_HECTARE
          )}, ${_trataBind(object.AREA)}, ${_trataBind(object.DELETADO)}),`;

          if (count == 1000) {
            sqlInsert = sqlInsert.slice(0, -1) + ";";
            await banco.executa(sqlInsert);
            sqlInsert = null;
            count = 0;
          }
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    /* try {
      var tabela = "tanque";
      if (data[tabela]) {
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (ID, NOME, ATIVO,DIGITAL) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}, ${_trataBind(object.ativo)}, ${_trataBind(object.digital)}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    } */

    /* try {
      var tabela = "comboio";
      if (data[tabela]) {
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (ID, NOME, ATIVO, POSTO_COMBUSTIVEL) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}, ${_trataBind(object.ativo)}, ${_trataBind(
            object.posto_combustivel
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    } */

    /* try {
      var tabela = "bombas_tanque";
      if (data[tabela]) {
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (ID, NOME, CAPACIDADE, TANQUE_ID,COMBOIO_ID, MATERIAL) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}, ${_trataBind(object.capacidade)}, ${_trataBind(
            object.tanque_id
          )}, ${_trataBind(object.comboio_id)}, ${_trataBind(
            object.material_id
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    } */

    /* try {
      var tabela = "material_abastecimento";
      if (data[tabela]) {
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (ID, NOME, UNIDADE, GRAXA, COMBUSTIVEL) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}, ${_trataBind(object.unidade_id)}, ${_trataBind(
            object.graxa
          )}, ${_trataBind(object.combustivel)}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    } */

    /* try {
      var tabela = "tolerancia";
      if (data[tabela]) {
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (ID, MEDICAO, TOLERANCIA) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.medicao
          )}, ${_trataBind(object.tolerancia)}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    } */

    /* try {
      var tabela = "planilha_tanque";
      if (data[tabela]) {
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (ID, MEDICAO, ESTOQUE, TANQUE, COMBOIO, UNIDADE) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.medicao
          )}, ${_trataBind(object.estoque)}, ${_trataBind(
            object.tanque_id
          )}, ${_trataBind(object.comboio_id)}, ${_trataBind(
            object.unidade_id
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    } */

    try {
      var tabela = "apontar_mecanico_sem_os";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (object.integrado == "S") {
            var sql = `UPDATE ${tabela} SET sync_deskTop = 1 WHERE id = ? and id_mobile = ?;`;
            var params = [object.id_mobile, object.key_mobile];
            await banco.executa(sql, params);
          }
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "os";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (object.integrado == "S") {
            var sql = `UPDATE ${tabela} SET sync_deskTop = 1 WHERE id = ? and id_mobile = ?;`;
            var params = [object.id_mobile, object.key_mobile];
            await banco.executa(sql, params);
          }
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "almoxarifado_material";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, almoxarifado_id, material_id) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.almoxarifado_id
          )}, ${_trataBind(object.material_id)}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "lanca_os_silvicultura";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id,empresa_main, fornecedor, dataemissao, mesinicial,mesfinal,fazenda,numero,modulo, status) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.empresa_id
          )}, ${_trataBind(object.fornecedor_id)}, ${_trataBind(
            object.data_emissao
          )}, ${_trataBind(object.mes_inicial)}, ${_trataBind(
            object.mes_final
          )}, ${_trataBind(object.fazenda_id)}, ${_trataBind(
            object.numero_os
          )}, ${_trataBind(object.modulo)}, ${_trataBind(
            object.status_atual
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "operacoes_os_silvicultura";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id,lanca_os_silvicultura, operacao, fazenda, projeto_estrutural,talhao,area,qtde_contratada,projeto,unidade,area_nao_talhonada,area_realizada,status,situacao) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.lanca_os_silvicultura_id
          )}, ${_trataBind(object.operacao_id)}, ${_trataBind(
            object.fazenda_id
          )}, ${_trataBind(object.projeto_estrutural_id)}, ${_trataBind(
            object.talhao_id
          )}, ${_trataBind(object.area_ha)}, ${_trataBind(
            object.qtde_contratada
          )}, ${_trataBind(object.projeto_id)}, ${_trataBind(
            object.unidade_id
          )}, ${_trataBind(object.area_nao_talhonada)},${_trataBind(
            object.area_realizada
          )},${_trataBind(object.status_atual)},${_trataBind(object.status)}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    /* try {
      var tabela = "fator_empilhamento";
      if (data[tabela]) {
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id,talhao, tamanho_madeira, fator, data_ini,data_fim,upc) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.talhao_id
          )}, ${_trataBind(object.tamanho_lenha_id)}, ${_trataBind(
            object.fator
          )}, ${_trataBind(object.data_ini)}, ${_trataBind(
            object.data_fim
          )}, ${_trataBind(object.upc_id)}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    } */

    try {
      var tabela = "codigo_diario_bordo";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id, numero, atualizar_hora, descricao, operacao_inicio, operacao_fim, solicita_turno, solicita_maquina, solicita_horimetro, solicitar_area_realizada, solicita_media_area_feixe, confirma_lancamento_producao_ao_finalizar, solicita_total_arvores, exibie_contador_ciclo, solicita_metro_cubico_sortimento, aparecer_botoes_ciclo_vazio_carregado, solicitar_quantidade_carga_baldeadas, solicita_placa_caminhao,solicita_qual_sortimento_carregado, solicita_numero_guia, regiao_obrigatoria, operacao_reboque, operacao_guincho, solicitar_placa_caminhao_guinchado, solicitar_somente_quantidade_placa, solicitar_quantidade_cargas, modulo,operacao_sem_producao,solicita_quantidade_drenagem_arte,solicita_local_coleta_agua,diario_bordo_vinc_opcoes,solicita_observacao,operacao_parada,operacional,solicita_talhao,solicita_frente_servico, solicitar_apontamento_check_list_operacional, gerar_alert_caso_n_apont_sort, solicita_operacao_encarregado,captura_localizacao_patrimonio,tipo_manut_serra_sabre,solicita_msg_step,solicita_perc_carga_comp,hab_guia_perc_sortimento, solicita_check_list_prox_lanc, hab_operacao_inicio, hab_operacao_fim, horario_almoco  ) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.numero
          )}, ${_trataBind(object.atualiza_hora_automatica)}, ${_trataBind(
            object.descricao
          )}, ${_trataBind(object.operacao_inicio)}, 
       ${_trataBind(object.operacao_fim)}, ${_trataBind(
            object.solicita_turno
          )}, ${_trataBind(object.solicita_maquina)}, 
       ${_trataBind(object.solicita_horimetro)}, ${_trataBind(
            object.solicitar_area_realizada
          )}, ${_trataBind(object.solicita_media_arvore_feixe)}, 
       ${_trataBind(
            object.confirma_lancamento_producao_ao_finalizar
          )}, ${_trataBind(object.solicita_total_arvores)}, ${_trataBind(
            object.exibe_contador_ciclo
          )},
       ${_trataBind(object.solicita_metro_cubico_sortimento)}, ${_trataBind(
            object.aparecer_botoes_ciclo_vazio_carregado
          )}, 
       ${_trataBind(object.solicitar_quantidade_carga_baldeadas)}, ${_trataBind(
            object.solicita_placa_caminhao
          )},
       ${_trataBind(object.solicita_qual_sortimento_carregado)}, ${_trataBind(
            object.solicita_numero_guia
          )}, ${_trataBind(object.regiao_obrigatoria)},
       ${_trataBind(object.operacao_reboque)}, ${_trataBind(
            object.operacao_guincho
          )}, ${_trataBind(object.solicitar_placa_caminhao_guinchado)}, 
       ${_trataBind(object.solicitar_somente_quantidade_placa)}, ${_trataBind(
            object.solicitar_quantidade_cargas
          )}, ${_trataBind(object.modulo)},
       ${_trataBind(object.operacao_sem_producao)}, ${_trataBind(
            object.solicita_quantidade_drenagem_arte
          )}, 
       ${_trataBind(object.solicita_local_coleta_agua)}, ${_trataBind(
            object.diario_bordo_vinc_opcoes_id
          )}, 
       ${_trataBind(object.solic_observ_obrig)}, ${_trataBind(
            object.operacao_parada_codigo
          )}, ${_trataBind(object.operacional_codigo)},
       ${_trataBind(object.solicita_talhao)},${_trataBind(
            object.solicita_frente_servico
          )},${_trataBind(object.solicitar_apontamento_check_list_operacional)},
       ${_trataBind(object.gerar_alert_caso_n_apont_sort)}, ${_trataBind(
            object.solicita_operacao_encarreg
          )},${_trataBind(object.captura_localizacao_patrimonio)},
          ${_trataBind(object.tipo_manut_serra_sabre)},
          ${_trataBind(object.solicita_msg_step)},
          ${_trataBind(object.solicita_perc_carga_comp)},
          ${_trataBind(object.hab_guia_perc_sortimento)},
          ${_trataBind(object.solicita_check_list_prox_lanc)},
          ${_trataBind(object.hab_operacao_inicio)},
          ${_trataBind(object.hab_operacao_fim)},
          ${_trataBind(object.horario_almoco)}),`;
        }
        
        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "tipo_operacao";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id,descricao, tipo_geral, modulo,excluido) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.descricao
          )}, ${_trataBind(object.tipo_geral)}, ${_trataBind(
            object.tipo_modulo
          )}, ${_trataBind(object.excluido)}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "compartimento_patrimonio";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id,nome) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.nome
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "rel_compartimento_patrimonio";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id,patrimonio,compartimento_patrimonio) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(object.patrimonio_id)},${_trataBind(object.compartimento_patrimonio_id)}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }


    try {
      var tabela = "diario_bordo";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id,codigo_diario, descricao, modulo,excluido) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.codigo_diario
          )}, ${_trataBind(object.descricao)}, ${_trataBind(
            object.tipo_modulo
          )}, ${_trataBind(object.excluido)}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "diario_bordo_vinc_opcoes";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id,diario_bordo, codigo_diario_bordo, tipo_operacao,ativo) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.diario_bordo_id
          )}, ${_trataBind(object.controle_diario_bordo_id)}, ${_trataBind(
            object.tipo_operacao_id
          )}, ${_trataBind(object.ativo)}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "operacao_tipo";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id,operacao, tipo_operacao) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.operacao_id
          )}, ${_trataBind(object.tipo_operacao_id)}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "medida";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id,descricao) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.descricao
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "material_medida";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id,medida,material,quantidade,material_desc,especie_id) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.medida_id
          )}, ${_trataBind(object.material_id)}, ${_trataBind(
            object.quantidade
          )}, ${_trataBind(object.material_desc)},${_trataBind(
            object.especie_id
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "patrimonio_tipo";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id,patrimonio, tipo_operacao) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.patrimonio_id
          )}, ${_trataBind(object.tipo_operacao_id)}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "espacamentos";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id,espacamento1, espacamento2, descricao) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.espacamento1
          )}, ${_trataBind(object.espacamento2)}, ${_trataBind(
            object.descricao
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "permissao";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (modulo,pagina,visualizar,incluir,alterar,excluir,usuario) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.modulo)}, ${_trataBind(
            object.pagina
          )}, ${_trataBind(object.visualizar)}, ${_trataBind(
            object.incluir
          )}, ${_trataBind(object.alterar)}, ${_trataBind(
            object.excluir
          )}, ${_trataBind(object.usuario_id)}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "insumos_os_silvicultura";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id,lanca_os_silvicultura,insumo,quantidade,componente_os_delphi_id, operacao_id,operacoes_os_silvicultura) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.lanca_os_silvicultura_id
          )}, ${_trataBind(object.material_id)}, ${_trataBind(
            object.quantidade
          )}, ${_trataBind(object.componente_os_delphi_id)}, ${_trataBind(
            object.operacao_id
          )}, ${_trataBind(object.operacoes_os_silvicultura_id)}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "detalhe_talhao_operacao_planejado";
      if (data[tabela]) {
        
        var sqlInsert = null;
        var count = 0;
        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];
          count++;
          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (DATA_INI, DATA_FIM, MES_ANO, CUSTO_UNITARIO, PRECO_AREA, PRECO_TOTAL, OPERACAO_ID, FAZENDA_ID, TALHAO_ID, COD_TALHAO, COD_CRONOGRAMA) VALUES `;
          }

          sqlInsert += `(${_trataBind(new Date(object.DATA_INI))}, ${_trataBind(
            new Date(object.DATA_FIM)
          )}, ${_trataBind(object.MES_ANO)}, ${_trataBind(
            object.CUSTO_UNITARIO
          )}, ${_trataBind(object.PRECO_AREA)}, ${_trataBind(
            object.PRECO_TOTAL
          )}, ${_trataBind(object.OPERACAO_ID)}, ${_trataBind(
            object.FAZENDA_ID
          )}, ${_trataBind(object.TALHAO_ID)}, ${_trataBind(
            object.COD_TALHAO
          )}, ${_trataBind(object.COD_CRONOGRAMA)}),`;

          if (count == 1000) {
            sqlInsert = sqlInsert.slice(0, -1) + ";";
            await banco.executa(sqlInsert);
            sqlInsert = null;
            count = 0;
          }
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "prescricao_tecnica";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id,operacao,regiao,talhao,executa_operacao,genero,prescricao_tecnica,descricao,lanca_os_silvicultura) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.operacao_id
          )}, ${_trataBind(object.regiao_id)}, ${_trataBind(
            object.talhao_id
          )}, ${_trataBind(object.executa_operacao)}, ${_trataBind(
            object.genero
          )}, ${_trataBind(object.prescricao_tecnica)}, ${_trataBind(
            object.descricao
          )}, ${_trataBind(object.lanca_os_silvicultura_id)}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    try {
      var tabela = "insumos_prescricao_tecnica";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id,insumo,dosagens,unidade,espacamento,calda,prescricao_tecnica) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.insumos_id
          )}, ${_trataBind(object.dosagens)}, ${_trataBind(
            object.unidade_id
          )}, ${_trataBind(object.espacamento_id)}, ${_trataBind(
            object.calda
          )}, ${_trataBind(object.prescricao_id)}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    /* try {
      var tabela = "tanque_comboio_operador";
      if (data[tabela]) {
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id,tanque,comboio,usuario) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.cod_tanque
          )}, ${_trataBind(object.cod_comboio)}, ${_trataBind(
            object.usuario
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    } */

    /* try {
      var tabela = "tipo_movimenta_oper";
      if (data[tabela]) {
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id,movimentacao_abastecimento,usuario) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.cod_interno
          )}, ${_trataBind(object.usuario)}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    } */

    /* try {
      var tabela = "entrada_combustivel_graxa";
      if (data[tabela]) {
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id,data,quantidade,tanque,comboio,bombas_tanque) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.data
          )}, ${_trataBind(object.quantidade)}, ${_trataBind(
            object.id_tanque
          )}, ${_trataBind(object.id_comboio)}, ${_trataBind(
            object.bombas_tanque_id
          )}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    } */

    try {
      var tabela = "frente_servico";
      if (data[tabela]) {
        
        var sqlInsert = null;

        for (var i = 0; i < data[tabela].length; i++) {
          var object = data[tabela][i];

          if (!sqlInsert) {
            sqlInsert = `INSERT INTO ${tabela} (id,descricao,funcionario) VALUES `;
          }

          sqlInsert += `(${_trataBind(object.id)}, ${_trataBind(
            object.descricao
          )}, ${_trataBind(object.supervisor_func_id)}),`;
        }

        if (sqlInsert) {
          sqlInsert = sqlInsert.slice(0, -1) + ";";
          await banco.executa(sqlInsert);
        }
      }
    } catch (ex) {
      _manipulaError(`Erro ao popular ${tabela}`, ex, sqlInsert);
    }

    await _grupoDiario(data);
  };

  $scope.updateNome = async function () {
    try {
      var sql =
        "SELECT e.id empresa, e.nome empresaNome FROM empresa_principal eP INNER JOIN empresa e ON e.id = eP.empresa ORDER BY eP.id DESC LIMIT 1";
      var resultado = await banco.executa(sql);
      var lista = Array.from(resultado.rows);
      if (lista.length) {
        var row = lista[lista.length - 1];
        $scope.enterprise = row;
        $scope.components.empresa = row.empresa;
      }

      $scope.$apply();

      _fimLoad();
    } catch (ex) {
      _manipulaError(`Erro ao atualizar nome da Empresa`, ex);
    }
  };

  $scope.setaEmpresaPrincipal = function () {
    DatabaseValues.setup();
    DatabaseValues.bancoDeDados.transaction(function (transacao) {
      var sql =
        "INSERT INTO empresa_principal (empresa, unidade_produtiva) VALUES(?,?);";
      params = ["4", "0"];

      transacao.executeSql(
        sql,
        params,
        function () { },
        function (transacao, erro) {
          console.log(
            "Tabela: empresa_principal \n SQL: " +
            sql +
            "\n Params:" +
            JSON.stringify(params) +
            "\n Erro: " +
            erro.message
          );
        }
      );
    });
  };

  $scope.verificaCampos = function () {
    DatabaseValues.setup();
    DatabaseValues.bancoDeDados.transaction(function (transacao) {
      var sql = "select * from controle_diario limit 1";
      var params = [];
      transacao.executeSql(
        sql,
        params,
        function (tx, result) {
          for (var i = 0; i < result.rows.length; i++) {
            var row = result.rows.item(i);
            if (row.modulo) {
            } else {
              var sql =
                "ALTER TABLE controle_diario ADD COLUMN `modulo` INTEGER DEFAULT 1";
              var params = [];
              transacao.executeSql(
                sql,
                params,
                function (tx, result) { },
                function (transacao, error) {
                  console.log("Erro: " + error.message);
                }
              );
            }
          }
        },
        function (transacao, error) {
          console.log("Erro: " + error.message);
        }
      );
    });
  };

  /* parte que veio do component */
  $scope.setaEmpresaPrincipal = function () {
    DatabaseValues.setup();
    DatabaseValues.bancoDeDados.transaction(function (transacao) {
      var sql =
        "INSERT INTO empresa_principal (empresa, unidade_produtiva) VALUES(?,?);";
      params = ["3", "0"];

      transacao.executeSql(
        sql,
        params,
        function () { },
        function (transacao, erro) {
          console.log(
            "Tabela: empresa_principal \n SQL: " +
            sql +
            "\n Params:" +
            JSON.stringify(params) +
            "\n Erro: " +
            erro.message
          );
        }
      );
    });
  };

  $scope.logoff = function () {
    DatabaseValues.setup();
    DatabaseValues.bancoDeDados.transaction(function (transacao) {
      var sql = "delete from usuario";
      var params = [];

      transacao.executeSql(
        sql,
        params,
        function () {
          $scope.gif = false;
          $scope.mat = 0;
          $scope.$apply();
        },
        function (transacao, erro) {
          console.log(erro.message);
        }
      );
    });
  };

  $scope.salvar = function () {
    $scope.ip = "";
    $scope.gif = true;
    DatabaseValues.setup();
    DatabaseValues.bancoDeDados.transaction(function (transacao) {
      var sql = "";
      sql = "SELECT * FROM 'config_ip'";
      params = [];
      transacao.executeSql(
        sql,
        params,
        function (tx, result) {
          for (var i = 0; i < result.rows.length; i++) {
            var row = result.rows.item(i);
            $scope.ip = row.ip;
            $scope.porta443 = row.porta === 443;
            break;
          }

          $scope.carregamentos = 1 + $scope.carregamentos;
          $scope.$apply();

          console.log($scope.ip);

          if ($scope.usuario != "" && $scope.senha != "") {
            if (onOnline()) {
              $.ajax({
                url: _pegarRota($scope.ip, "POST"),
                type: "POST",
                timeout: 30 * 1000,
                dataType: "json",
                data: {
                  usuario: $scope.usuario,
                  senha: $scope.senha,
                },
                success: function (data) {
                  //var contadorMA = 0;

                  if (!data.matriculado) {
                    $scope.sincroniaMSG = "Usuário ou Senha Incorreto";
                    $scope.mat = 0;
                    $scope.gif = false;

                    $scope.$apply();
                  } else {
                    DatabaseValues.setup();
                    DatabaseValues.bancoDeDados.transaction(function (
                      transacao
                    ) {
                      //contadorMA = data.empresa.length;
                      // popula banco

                      console.log(data.usuario[0].id);

                      var sql =
                        "INSERT INTO empresa_principal (empresa, unidade_produtiva) VALUES(?,?);";
                      params = ["1", "0"];

                      transacao.executeSql(
                        sql,
                        params,
                        function () { },
                        function (transacao, erro) {
                          alert(erro.message);
                        }
                      );

                      $scope.updateNome();
                    });
                    $scope.setaPermissao(data);
                    $scope.setaUsuario(
                      data.usuario[0].id,
                      data.usuario[0].nome,
                      data.usuario[0].senha
                    );
                    DatabaseValues.setup();
                    DatabaseValues.bancoDeDados.transaction(function (
                      transacao
                    ) {
                      var sql = "delete from acesso ;";
                      params = [];
                      transacao.executeSql(
                        sql,
                        params,
                        function (tx, error) { },
                        function (transacao, erro) {
                          alert(erro.message);
                        }
                      );
                      angular.forEach(data, function (value, key) {
                        angular.forEach(value, function (object) {
                          var sql = "";
                          var params = [];

                          if (key == "acesso") {
                            var sql =
                              "INSERT INTO acesso (id, nome, senha) VALUES (?,?,?);";
                            params = [object.id, object.nome, object.senha];

                            transacao.executeSql(
                              sql,
                              params,
                              function (tx, error) { },
                              function (transacao, erro) {
                                alert(erro.message);
                              }
                            );
                          } else if (key == "permissao_acesso") {
                            var sql =
                              "INSERT INTO `permissao_acesso` (modulo,pagina,visualizar,incluir,alterar,excluir,usuario) VALUES (?,?,?,?,?,?,?)";
                            var params = [
                              object.modulo,
                              object.pagina,
                              object.visualizar,
                              object.incluir,
                              object.alterar,
                              object.excluir,
                              object.usuario_id,
                            ];
                            transacao.executeSql(
                              sql,
                              params,
                              function (tx, error) { },
                              function (transacao, erro) {
                                alert("Erro permissao_acesso: " + erro.message);
                              }
                            );
                          }
                        });
                      });
                    });
                  }
                },
                error: function (err) {
                  DatabaseValues.setup();
                  DatabaseValues.bancoDeDados.transaction(function (transacao) {
                    var sql =
                      "SELECT * from acesso where nome = ? and senha = ?;";
                    params = [$scope.usuario, $scope.senha];

                    transacao.executeSql(sql, params, function (tx, result) {
                      if (result.rows.length > 0) {
                        for (var i = 0; i < result.rows.length; i++) {
                          var row = result.rows.item(i);
                          $scope.setaPermissaoOffline(row);
                          $scope.setaUsuario(row.id, row.nome, row.senha);
                        }
                      } else {
                        $scope.carregamentos = 0;
                        $scope.sincroniaMSG = "Usuário ou senha incorreto!";
                        $scope.gif = false;
                        $scope.$apply();
                      }
                    });
                  });
                },
              });
            } else {
              DatabaseValues.setup();
              DatabaseValues.bancoDeDados.transaction(function (transacao) {
                var sql = "SELECT * from acesso where nome = ? and senha = ?;";
                params = [
                  $filter("uppercase")($scope.usuario),
                  btoa($filter("uppercase")($scope.senha)),
                ];
                console.log($filter("uppercase")($scope.usuario));
                console.log(btoa($filter("uppercase")($scope.senha)));
                transacao.executeSql(sql, params, function (tx, result) {
                  if (result.rows.length > 0) {
                    for (var i = 0; i < result.rows.length; i++) {
                      var row = result.rows.item(i);
                      $scope.setaPermissaoOffline(row);
                      $scope.setaUsuario(row.id, row.nome, row.senha);
                    }
                  } else {
                    $scope.carregamentos = 0;
                    $scope.sincroniaMSG = "Usuário ou senha incorreto!";
                    $scope.gif = false;
                    $scope.$apply();
                  }
                });
              });
            }
          }
        },
        function (transacao, erro) {
          console.log("Erro: " + erro.message);
        }
      );
    });
  };

  $scope.salvarIp = function (ip) {
    console.log();
    if (ip != "") {
      try {
        $scope.validaIp = true;

        $.ajax({
          url: _pegarRota(ip, "POST"),
          type: "POST",
          dataType: "json",
          data: {
            matricula: "",
          },
          success: function (data) {
            console.log("Sucesso!");
            $scope.setaIp(ip);
          },
          error: function (err) {
            console.log("Erro");
            $scope.setaErroIp();
          },
        });
      } catch (err) {
        //document.getElementById("demo").innerHTML = err.message;
        $scope.setaErroIp();
      }
    }
  };

  $scope.alterarIp = function () {
    console.log();
    if ($scope.enderecoIp != "") {
      try {
        $scope.validaIp = true;

        $.ajax({
          url: _pegarRota($scope.enderecoIp, "POST"),
          type: "POST",
          dataType: "json",
          data: {
            matricula: "",
          },
          success: function (data) {
            $scope.validaIp = false;
            $scope.setaIp();
            alert("Alteração realizada com Sucesso!");
            $state.go("app.components");
          },
          error: function (err) {
            $scope.validaIp = false;
            console.log("Erro");
            $scope.setaErroIp();
          },
        });
      } catch (err) {
        //document.getElementById("demo").innerHTML = err.message;
        $scope.setaErroIp();
      }
    }
  };

  $scope.logado = false;

  $scope.logar = function () {
    console.log();
    if ($scope.senha != "") {
      try {
        $scope.autenticacao = true;

        DatabaseValues.setup();
        DatabaseValues.bancoDeDados.transaction(function (transacao) {
          var sql = "SELECT * FROM acesso WHERE senha = ?";
          var params = [btoa($filter("uppercase")($scope.senha))];
          transacao.executeSql(sql, params, function (tx, result) {
            for (var i = 0; i < result.rows.length; i++) {
              console.log("aqui");
              $scope.autenticacao = false;
              $scope.logado = true;
              $scope.verificaIp();
              $scope.$apply();
              break;
            }
            if (!$scope.logado) {
              $scope.autenticacao = false;
              $scope.$apply();
              alert("Senha Incorreta!");
            }
          });
        });
      } catch (err) {
        //document.getElementById("demo").innerHTML = err.message;
      }
    } else {
      alert("Informe uma senha");
    }
  };

  var val = [];
  $scope.carregamentos = 0;
  
  $scope.msgWait = "Aguarde...";
  $scope.success = 0;
  $scope.tipoEnviar = 0;

  $scope.excluir = function (data) {
    DatabaseValues.setup();
    DatabaseValues.bancoDeDados.transaction(function (transacao) {
      params = [];
      transacao.executeSql("DROP TABLE IF EXISTS talhao;", params, function (
        trasacao
      ) { });

      sql =
        " CREATE TABLE IF NOT EXISTS talhao (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `nome` TEXT, `projeto_estrutural_id` INTERGER);";
      params = [];
      transacao.executeSql(sql, params, function (tx, result) { });
    });

    angular.forEach(data, function (value, key) {
      angular.forEach(value, function (object) {
        var sql = "";
        var params = [];
        if (key != "mensagem" && key != "sincronizou") {
          if (key == "talhao") {
            var sql =
              "INSERT INTO " +
              key +
              " (id, nome, projeto_estrutural_id) VALUES (?,?,?);";
            params = [object.id, object.nome, object.projeto_estrutural_id];
            //transacao

            DatabaseValues.setup();
            DatabaseValues.bancoDeDados.transaction(function (transacao) {
              transacao.executeSql(sql, params, function (tx, error) { });
            });
          }
        }
      });
    });
    $scope.sincroniaMSG = data.mensagem;
    $scope.carregamentos = 0;
    $scope.$apply();
  };

  var _init = function () {
    _verificaPonto();
  };

  $scope.pontoEntrada = true;
  $scope.pontoSaida = true;

  var _verificaPonto = async function () {
    try {
      var sqlUsuario = "SELECT * FROM 'usuario'";
      var resultado = await banco.executa(sqlUsuario);
      var listaUsuario = Array.from(resultado.rows);
      console.log(listaUsuario[0].id);
      if (listaUsuario.length) {
        $scope.usuarioId = listaUsuario[0].id;
        $scope.$apply();

        var data = new Date();
        data.setHours(0, 0, 0, 0);
        var sql = `SELECT * FROM ponto_abastecimento where usuario_id = ? and data_int = ? order by id desc limit 1`;
        var params = [listaUsuario[0].id, data.getTime()];

        var resultado = await banco.executa(sql, params);
        var lista = Array.from(resultado.rows);
        console.log(lista);
        if (lista.length) {
          console.log(lista[0].diario_bordo_num);
          if (lista[0].diario_bordo_num == 2) {
            $scope.pontoEntrada = true;
            $scope.pontoSaida = false;
            $scope.$apply();
          }
        } else {
          $scope.pontoEntrada = true;
          $scope.pontoSaida = true;
        }
      }
    } catch (ex) {
      console.log(params);
      console.log("Erro ao verificar ponto no banco de dados!", ex);
    }
  };

  $scope.sicronizando = false;

  function createFile() {
    var type = window.TEMPORARY;
    var size = 5*1024*1024;
    window.requestFileSystem(type, size, successCallback, errorCallback)
 
    function successCallback(fs) {
       fs.root.getFile('log.txt', {create: true, exclusive: true}, function(fileEntry) {
          //alert('File creation successfull!')
       }, errorCallback);
    }
 
    function errorCallback(error) {
       console.log("ERROR: " + error.code)
    }
   
 }

 function writeFile(texto) {
  var type = window.TEMPORARY;
  var size = 5*1024*1024;
  window.requestFileSystem(type, size, successCallback, errorCallback)

  function successCallback(fs) {
     fs.root.getFile('log.txt', {create: true}, function(fileEntry) {

        fileEntry.createWriter(function(fileWriter) {
           fileWriter.onwriteend = function(e) {
              //alert('Write completed.');
           };

           fileWriter.onerror = function(e) {
              alert('Write failed: ' + e.toString());
           };

           var blob = new Blob([texto], {type: 'text/plain'});
           fileWriter.write(blob);
        }, errorCallback);
     }, errorCallback);
  }

  function errorCallback(error) {
     alert("ERROR: " + error.code)
  }
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

  $scope.sincronizar = async function (tipoEnviar) {
    try {
      $scope.tipoEnviar = parseInt(tipoEnviar);

      $scope.empresas = [];
      $scope.carregamentos = 0;
      $scope.sincroniaMSG = "";
      console.log($scope.dados);
      await _preparaParaEnvio(tipoEnviar);
      var url = _pegarRota($scope.dados.ip, "POST");
      var data = null;

      if (tipoEnviar === 1) {
        _inicioLoad("Enviando Dados...");
        $scope.msgWait = "Enviando...";
        $scope.sincroniaMSG = "Enviando...";
        data = { data: JSON.stringify($scope.dados) };
        console.log(data.data, 'data');
        /*$cordovaFile.writeFile('file.txt', 'teste jv', { 'append': false }).then(function (result) {
          alert('sucesso : ' + result);
        }, function (err) {
          alert('erro : ' + err.message)
        });*/

        createFile();
        writeFile(JSON.stringify(data));
      } else if (tipoEnviar === 0) {
        $scope.msgWait = "Baixando...";
        $scope.sincroniaMSG = "Em Processo... Aguarde";
        url = _pegarRota($scope.dados.ip, "GET");
        data = { usuarioId: $scope.dados.usuarioId };
        await _criarTabelasDadosBasicos();
        _inicioLoad("Baixando Dados...");
      } else {
        alert("Erro ao detectar tipo de sincronia");
      }

      if ($scope.dados.ip.length === 0) {
        //alert($scope.dados.ip);
        // alert('Favor entrar em contato com A.N.I Sistema! (37) 3524-1774 / (37) 3524-1274');
        $state.go("app.configIp");
        _fimLoad();
        return;
      }

      $scope.atualizando = true;

      var promise = new Promise((resolve, reject) => {
        $.ajax({
          url: url,
          type: "POST",
          dataType: "text",
          data: data,
          success: function (data) {
            console.log(data);
            resolve(JSON.parse(data));
          },
          error: function (error) {
            alert('Erro ao comunicar com servidor');
            reject(error);
          },
        });
      });

      var data = await promise;
      console.log(data);

      if (tipoEnviar === 1) {
        _inicioLoad("Dados Recebidos...");
        $scope.enviouTudo = true;
        $scope.espera = 5;
        if(data.erro){
          $scope.sincroniaMSG = "Erro na Conexão, Servidor ou Banco de Dados";
          $scope.$apply();
        }else if (data.sincronizou.length === 0 && Number(data.tempo_upload) == 6) {
          $scope.sincroniaMSG = "Sem dados para carregar";
          $scope.$apply();
        }else if(Number(data.tempo_upload) == 0){
          $scope.tempoEspera = 1;
          $scope.sincroniaMSG = "Aguarde 5 minutos para realizar o Upload dos dados!";          
          $scope.$apply();
          setTimeout(function(){
            $scope.calcTempoEspera();
          },15000);
        }

        if (data.lacamento_diario && data.lacamento_diario.length) {
          for (var i = 0; i < data.lacamento_diario.length; i++) {
            var object = data.lacamento_diario[i];
            var sql =
              "UPDATE controle_diario SET codigo_intermediario = ? WHERE id = ?";
            var params = [object.codigo, object.id];

            await banco.executa(sql, params);
          }
        }

        if (
          data.lacamento_diario_cabecalho &&
          data.lacamento_diario_cabecalho.length
        ) {
          for (var i = 0; i < data.lacamento_diario_cabecalho.length; i++) {
            var object = data.lacamento_diario_cabecalho[i];
            var sql =
              "UPDATE controle_diario_grupo SET codigo_intermediario = ? WHERE id = ?";
            var params = [object.codigo, object.id];

            await banco.executa(sql, params);
          }
        }
        if (data.sincronizou && data.sincronizou.length) {
          var sql = null;
          var cont = 0;
          var id = '';
          for (var i = 0; i < data.sincronizou.length; i++) {
            cont++;
            var object = data.sincronizou[i];
            if (i > 0) {

              if (object.tabela === data.sincronizou[i - 1].tabela) {
                id += ',' + object.id
              } else {
                var tabela = data.sincronizou[i - 1].tabela;
                var sql = `UPDATE ${tabela} SET sync = ? WHERE id in(${id})`;
                var params = [1];
                console
                await banco.executa(sql, params);
                id = object.id;
              }

            } else {
              id = object.id;
            }

            
            if (data.sincronizou.length - 1 === i) {
              if (id != '') {
                var sql = `UPDATE ${object.tabela} SET sync = ? WHERE id in(${id})`;
                var params = [1];

                await banco.executa(sql, params);
              }
              $scope.carregamentos = 0;
              $scope.sincroniaMSG = data.mensagem;
              $scope.sicronizando = false;
              $scope.atualizando = false;
              _fimLoad();

              /* if(data.etiquetasDuplicadas && data.etiquetasDuplicadas.length){
                
                let numEtiquetas = '';
                for (var i = 0; i < data.etiquetasDuplicadas.length; i++) {
                  cont++;
                  var object = data.etiquetasDuplicadas[i];
                  numEtiquetas += numEtiquetas.length == 0  ? object.id : ' ,'+object.id;
      
                  console.log('object == ',object.id);
                } 
                let msg = ''; 
                
                msg = data.etiquetasDuplicadas.length > 1 ?  `<p>As Etiquetas de Nº : `+numEtiquetas+` já estão lançadas no SGIF </p>` : `<p>A Etiqueta de Nº : `+numEtiquetas+` já esta lançada no SGIF </p>`;
                      
                $scope.showAlert("Atenção", msg);
              } */
            }
          }
        } else {
          
          _fimLoad();
          /* if(data.etiquetasDuplicadas && data.etiquetasDuplicadas.length){
            $scope.carregamentos = 0;
            $scope.sincroniaMSG = 'Etiqueta(s) duplicada(s)';
            $scope.sicronizando = false;
            $scope.atualizando = false;    
            let numEtiquetas = '';

            for (var i = 0; i < data.etiquetasDuplicadas.length; i++) {
              cont++;
              var object = data.etiquetasDuplicadas[i];
              numEtiquetas += numEtiquetas.length == 0  ? object.id : ' ,'+object.id;
  
              console.log('object == ',object.id);
            } 
            let msg = ''; 
            
            msg = data.etiquetasDuplicadas.length > 1 ?  `<p>As Etiquetas de Nº : `+numEtiquetas+` já estão lançadas no SGIF </p>` : `<p>A Etiqueta de Nº : `+numEtiquetas+` já esta lançada no SGIF </p>`;
                  
            $scope.showAlert("Atenção", msg);
          } */
          
        }
      } else if (tipoEnviar === 0) {
        console.log("criando");

        console.log("populando");
        await _populaDadosBasicos(data);
      }
    } catch (ex) {
      $scope.carregamentos = 0;
      $scope.atualizando = false;
      $scope.sincroniaMSG = "Erro na Conexão, Servidor ou Banco de Dados";
      console.log('erro');
      _manipulaError("Erro ao Enviar/Receber dados", ex); 
    }

    _fimLoad();
  }; //SINCRONIA

  $scope.setaEmpresaPrincipal = function () {
    DatabaseValues.setup();
    DatabaseValues.bancoDeDados.transaction(function (transacao) {
      var sql =
        "INSERT INTO empresa_principal (empresa, unidade_produtiva) VALUES(?,?);";
      params = ["4", "0"];

      transacao.executeSql(
        sql,
        params,
        function () { },
        function (transacao, erro) {
          console.log(
            "Tabela: empresa_principal \n SQL: " +
            sql +
            "\n Params:" +
            JSON.stringify(params) +
            "\n Erro: " +
            erro.message
          );
        }
      );
    });
  };

  _init();
});
