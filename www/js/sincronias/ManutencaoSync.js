app.controller('ManutencaoSync', function ($scope, $http, banco, $ionicLoading) {

    var devMode = true;

    var _pegarRota = function (ip, type) {

        var porta = ':8081';
        var prefix = 'http://';
        console.log($scope.$parent.porta443);
        if ($scope.porta443) {
            porta = '';
            prefix = 'https://';
        }

        var url = prefix + ip + porta + '/florestal/wrk/manutencao.php';

        if (type === 'GET') {
            return url + '?download=1';
        } else if (type === 'POST') {
            return url;
        }
    }

    var _manipulaError = function (msg, ex, sql) {

        if (devMode) {
            if (angular.isString(ex)) {
                alert(ex);
            } else if (ex && ex.message) {
                alert(ex.message);
                if (sql) {
                    alert(sql);
                }
            } else {
                alert(JSON.stringify(ex));
            }
        }

        if (msg) {
            alert(msg);
        } else {
            alert('Erro crítico entre em contato com suporte!');
        }

        console.error(ex);

        _fimLoad();

    }

    var _inicioLoad = function (upload) {

        var texto = upload ? 'Subindo dados' : 'Baixando Dados';
        var template = `<div class="loader"><svg class="circular"><circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"/></svg> ${texto} {{total}}</div>`;
        $ionicLoading.show({
            template: template
        });
    }

    var _fimLoad = function () {
        $ionicLoading.hide();
    }

    var _popularChecklistItens = async function (output) {
        try {

            var sql = 'DELETE FROM checklist_item WHERE 1';
            await banco.executa(sql);


            var sql = 'INSERT INTO checklist_item (id, delphID, nome) VALUES';
            if (output.checklistItens && output.checklistItens.length) {
                for (var i = 0; i < output.checklistItens; i++) {
                    var item = {};
                    item = output.checklistItens[i];

                    sql += ` (${item.delphID}, ${item.delphID}, '${item.nome}'),`;
                }

                sql = sql.slice(0, -1) + ';';


                await banco.executa(sql, params);
            }

        } catch (ex) {
            _manipulaError('Erro ao inserir itens', ex, sql);
        }
    }

    var _popularServicos = async function (output) {
        try {
            var sql = 'DELETE FROM servicos WHERE 1';
            await banco.executa(sql);

            var sql = 'INSERT INTO servicos (id, descricao) VALUES ';
            if (output.servicos && output.servicos.length) {
                for (var i = 0; i < output.servicos.length; i++) {
                    var item = {};
                    item = output.servicos[i];
                    sql += `  (${item.id}, '${item.descricao}'),`
                }
            }

            sql = sql.slice(0, -1) + ';';
            await banco.executa(sql, params);

        } catch (ex) {
            _manipulaError('Erro ao inserir Serviços', ex, sql);
        }
    }


    var _popularMecanicos = async function (output) {

        try {

            var sql = 'DELETE FROM mecanico WHERE 1';
            await banco.executa(sql);


            var sql = 'INSERT INTO mecanico (id, delphID, nome) VALUES';
            if (output.mecanicos && output.mecanicos.length) {
                for (var i = 0; i < output.mecanicos.length; i++) {
                    var item = {};
                    item = output.mecanicos[i];

                    sql += ` (${item.delphID}, ${item.delphID}, '${item.nome}'),`;
                }

                sql = sql.slice(0, -1) + ';';
                await banco.executa(sql);
            }

        } catch (ex) {
            _manipulaError('Erro ao inserir mecanicos', ex, sql);
        }
    }

    var _popularChecklist = async function (output) {
        try {

            var sql = 'DELETE FROM checklist WHERE 1';
            await banco.executa(sql);


            if (output.checkListOperacoes && output.checkListOperacoes.length) {
                var sql = 'INSERT INTO checklist (delphID, tipo, patrimonio_id, json, sync, updated) VALUES';

                for (var i = 0; i < Array.from(output.checkListOperacoes).length; i++) {
                    var checklist = {};
                    checklist = angular.extend(checklist, output.checkListOperacoes[i]);
                    sql += ` (${parseInt(checklist.delphID)}, ${checklist.tipo}, ${checklist.patrimonio.id}, '${JSON.stringify(checklist)}', 0, 0),`;
                }

                sql = sql.slice(0, -1) + ';';
                await banco.executa(sql);
            }

            if (output.checkListMecanico && output.checkListMecanico.length) {
                var sql = 'INSERT INTO checklist (delphID, tipo, patrimonio_id, json, sync, updated) VALUES';

                for (var i = 0; i < Array.from(output.checkListMecanico).length; i++) {
                    var checklist = {};
                    checklist = angular.extend(checklist, output.checkListMecanico[i]);
                    sql += ` (${checklist.delphID}, ${checklist.tipo}, ${checklist.patrimonio.id}, '${JSON.stringify(checklist)}', 0, 0),`;
                }

                sql = sql.slice(0, -1) + ';';
                await banco.executa(sql);
            }

        } catch (ex) {
            console.log(ex, sql);
            _manipulaError('Erro ao inserir checklist', ex, sql);
        }

    }


    var _popularMateriais = async function (output) {

        try {
            var sql = 'DELETE FROM material_ordem_servico WHERE 1;';
            await banco.executa(sql);


            if (output.materiais && output.materiais.length) {
                sql = 'INSERT INTO material_ordem_servico (id,descricao, unidade_id, unidade_nome, quantidade, codfabricante) VALUES';
                for (var i = 0; i < output.materiais.length; i++) {
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
    }

    var _popularPrioridades = async function (output) {

        try {

            var sql = 'DELETE FROM prioridade;';
            await banco.executa(sql);


            if (output.tipoPrioridade && output.tipoPrioridade.length) {
                sql = 'INSERT INTO prioridade (id, nome, codigosap) VALUES';
                for (var i = 0; i < output.tipoPrioridade.length; i++) {
                    var prioridade = {};
                    prioridade = output.tipoPrioridade[i];
                    prioridade.id = parseInt(prioridade.id);
                    prioridade.nome = prioridade.nome;
                    prioridade.codigoSAP = prioridade.codigoSAP;

                    sql += ` (${prioridade.id}, '${prioridade.nome}','${prioridade.codigoSAP}'),`;
                }

                sql = sql.slice(0, -1) + ';';
                await banco.executa(sql);
            }

        } catch (ex) {

            _manipulaError('Erro ao inserir prioridade', ex, sql);
        }
    }

    var _popularTipoNota = async function (output) {

        try {

            var sql = 'DELETE FROM tipo_nota;';
            await banco.executa(sql);

            if (output.tipoNota && output.tipoNota.length) {
                sql = 'INSERT INTO tipo_nota (id, json) VALUES';
                for (var i = 0; i < output.tipoNota.length; i++) {
                    var tipoNota = {};
                    tipoNota = output.tipoNota[i];
                    tipoNota.id = parseInt(tipoNota.id);

                    sql += ` (${tipoNota.id}, '${JSON.stringify(tipoNota)}'),`;
                }

                sql = sql.slice(0, -1) + ';';
                await banco.executa(sql);
            }

        } catch (ex) {
            _manipulaError('Erro ao inserir Tipo Nota', ex, sql);
        }
    }

    var _popularTipoOrdem = async function (output) {
        try {

            var sql = 'DELETE FROM tipo_ordem_servico WHERE 1';
            await banco.executa(sql);


            var sql = 'INSERT INTO tipo_ordem_servico (id, json) VALUES ';
            if (output.tipoOrdem && output.tipoOrdem.length) {
                for (var i = 0; i < output.tipoOrdem.length; i++) {
                    var tipo = {};
                    tipo = {};
                    tipo = output.tipoOrdem[i];
                    sql += ` (${tipo.id}, '${JSON.stringify(tipo)}'),`;
                }

                sql = sql.slice(0, -1) + ';';
                await banco.executa(sql);
            }

        } catch (ex) {
            _manipulaError('Erro ao inserir Tipos de Ordem', ex, sql);
        }
    }

    var _popularTipoAtividade = async function (output) {
        try {

            var sql = 'DELETE FROM tipo_atividade WHERE 1';
            await banco.executa(sql);


            if (output.tipoAtividade && output.tipoAtividade.length) {
                var sql = 'INSERT INTO tipo_atividade (id, json) VALUES ';
                for (var i = 0; i < output.tipoAtividade.length; i++) {
                    var tipo = {};
                    tipo = output.tipoAtividade[i];

                    sql += ` (${tipo.id}, '${JSON.stringify(tipo)}'),`;
                }

                sql = sql.slice(0, -1) + ';';

                if (output.tipoAtividade.length) {
                    await banco.executa(sql);
                }
            }

        } catch (ex) {
            _manipulaError('Erro ao inserir Tipos Atividade', ex, sql);
        }
    }

    var _popularSintomas = async function (output) {
        try {

            var sql = 'DELETE FROM sintoma WHERE 1';
            await banco.executa(sql);


            var sql = 'INSERT INTO sintoma (id, descricao) VALUES ';
            if (output.sintoma && output.sintoma.length) {
                for (var i = 0; i < output.sintoma.length; i++) {
                    var item = {};
                    item = output.sintoma[i];

                    sql += ` (${item.id}, '${item.descricao}'),`;
                }

                sql = sql.slice(0, -1) + ';';
                await banco.executa(sql);
            }

        } catch (ex) {
            _manipulaError('Erro ao inserir Sintoma', ex, sql);
        }
    }

    var _popularCausas = async function (output) {
        try {

            var sql = 'DELETE FROM causa WHERE 1';
            await banco.executa(sql);


            if (output.causa && output.causa.length) {

                var sql = 'INSERT INTO causa (id, descricao) VALUES ';
                for (var i = 0; i < output.causa.length; i++) {
                    var item = {};
                    item = output.causa[i];

                    sql += ` (${item.id}, '${item.descricao}'),`;
                }

                sql = sql.slice(0, -1) + ';';
                await banco.executa(sql);
            }

        } catch (ex) {
            _manipulaError('Erro ao inserir Causa', ex, sql);
        }
    }

    var _popularSolucoes = async function (output) {
        try {

            var sql = 'DELETE FROM solucao WHERE 1';
            await banco.executa(sql);


            if (output.solucao && output.solucao.length) {

                var sql = 'INSERT INTO solucao (id, descricao) VALUES ';
                for (var i = 0; i < output.solucao.length; i++) {
                    var item = {};
                    item = output.solucao[i];

                    sql += ` (${item.id}, '${item.descricao}'),`;
                }

                sql = sql.slice(0, -1) + ';';
                await banco.executa(sql);
            }

        } catch (ex) {
            _manipulaError('Erro ao inserir Solução', ex, sql);
        }
    }

    var _popularParteObjeto = async function (output) {
        try {

            var sql = 'DELETE FROM parte_objeto WHERE 1';
            await banco.executa(sql);


            if (output.parteObjeto && output.parteObjeto.length) {
                var sql = 'INSERT INTO parte_objeto (id, json, sistema_parte_objeto) VALUES ';
                for (var i = 0; i < output.parteObjeto.length; i++) {
                    var item = {};
                    item = output.parteObjeto[i];

                    sql += ` (${item.id}, '${JSON.stringify(item)}', ${item.sistemaParteObjetoId}),`;
                }

                sql = sql.slice(0, -1) + ';';
                await banco.executa(sql);
            }

        } catch (ex) {
            _manipulaError('Erro ao inserir Parte Objeto', ex, sql);
        }
    }

    var _popularSistemaParteObjeto = async function (output) {
        try {

            var sql = 'DELETE FROM sistema_parte_objeto WHERE 1';
            await banco.executa(sql);


            if (output.parteObjeto && output.parteObjeto.length) {
                var sql = 'INSERT INTO sistema_parte_objeto (id, json) VALUES ';
                for (var i = 0; i < output.sistemaParteObjeto.length; i++) {
                    var item = {};
                    item = output.sistemaParteObjeto[i];

                    sql += ` (${item.id}, '${JSON.stringify(item)}'),`;
                }

                sql = sql.slice(0, -1) + ';';
                await banco.executa(sql);
            }

        } catch (ex) {
            _manipulaError('Erro ao inserir Parte Objeto', ex, sql);
        }
    }

    var _popularCentrosDeTrabalho = async function (output) {
        try {

            var sql = 'DELETE FROM centro_trabalho WHERE 1';
            await banco.executa(sql);


            if (output.centroDeTrabalho && output.centroDeTrabalho.length) {
                var sql = 'INSERT INTO centro_trabalho (id, json) VALUES ';
                for (var i = 0; i < output.centroDeTrabalho.length; i++) {
                    var item = {};
                    item = output.centroDeTrabalho[i];

                    sql += ` (${item.id}, '${JSON.stringify(item)}'),`;
                }

                sql = sql.slice(0, -1) + ';';
                await banco.executa(sql);
            }

        } catch (ex) {
            _manipulaError('Erro ao inserir Centros de Trabalho', ex, sql);
        }
    }


    var _popularOrdensDeServico = async function (output) {
        try {

            var sql = 'DELETE FROM ordem_de_servico';
            await banco.executa(sql);


            if (output.os) {

                output.os = Array.from(output.os);
                if (output.os.length) {
                    
                    try {
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
                            console.log(os.data);
                            let data = new Date(os.data.date).getTime();
                            os.data = new Date(os.data.date);
                            os.dataInicioAvaria = new Date(os.dataInicioAvaria.date);
                            if (os.dataFimAvaria) {
                                os.dataFimAvaria = new Date(os.dataFimAvaria.date);
                            } else {
                                os.dataFimAvaria = '';
                            }
                            console.log(os.dataFimAvaria);
                            sql += ` (${os.delphID}, ${os.delphID}, '${data}', '${dtInicioAvaria}', '${dtFimAvaria}', '${status}', ${os.patrimonio.id}, ${mecanico}, ${tipoOrdem}, '${JSON.stringify(os)}', 1, 0,'${os.numeroSap}'),`;

                        }
                        sql = sql.slice(0, -1) + ';';

                        await banco.executa(sql);
                    } catch (ex) {
                        alert(ex.message);
                    }
                }
            }

        } catch (ex) {
            _manipulaError('Erro ao inserir Ordens de Serviço', ex, sql);
        }

    }

    var _popularSolicitacoesManutencao = async function (output) {
        try {

            var sql = 'DELETE FROM solicitacao_manutencao';
            await banco.executa(sql);
            if (output.lancamentoSolicitacaoManutencao) {

                output.lancamentoSolicitacaoManutencao = Array.from(output.lancamentoSolicitacaoManutencao);
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

    var _popularListaDeTarefa = async function (output) {
        try {

            var sql1 = 'DELETE FROM lista_de_tarefa WHERE 1';
            var sql2 = 'DELETE FROM modelo_lista_tarefas WHERE 1';
            await banco.executa(sql1);
            await banco.executa(sql2);

            if (output.listadetarefa && output.listadetarefa.length) {
                var sql1 = 'INSERT INTO lista_de_tarefa (id, descricao, modelo) VALUES ';
                var sql2 = 'INSERT INTO modelo_lista_tarefas (modeloid, listaid) VALUES ';

                let modelos = [];
                let listas = [];

                for (let i = 0; i < output.listadetarefa.length; i++) {
                    for (let i2 = 0; i2 < output.listadetarefa[i].length; i2++) {
                        let item = {};
                        item = output.listadetarefa[i][i2];
                        let lst = listas.find((x) => x.id == item.id)
                        if (!lst) {
                            listas.push(item);
                            sql1 += ` (${item.id},'${item.descricao}',${item.modelo}),`;
                        }
                        let mdl = modelos.find((x) => x.id == item.modelo)
                        if (!mdl) {
                            let modelo = {};
                            modelo.id = parseInt(item.modelo);
                            sql2 += ` (${item.modelo}, ${item.id}),`;
                        }
                    }
                }
                sql1 = sql1.slice(0, -1) + ';';
                sql2 = sql2.slice(0, -1) + ';';
                await banco.executa(sql1);
                await banco.executa(sql2);
            }

        } catch (ex) {
            _manipulaError('Erro ao inserir Lista de Tarefas', ex, sql1 + sql2);
        }
    }

    var _popularMaterialListaTarefas = async function (output) {
        try {

            var sql = 'DELETE FROM material_lista_tarefas WHERE 1';
            await banco.executa(sql);

            if (output.materialListaTarefa && output.materialListaTarefa.length) {
                var sql = 'INSERT INTO material_lista_tarefas (modeloid, listaid, materialid, quantidade, variacao) VALUES ';
                for (var i = 0; i < output.materialListaTarefa.length; i++) {
                    var item = {};
                    item = output.materialListaTarefa[i];
                    sql += ` (${item.modelo},  ${item.listaTarefa}, ${item.material}, ${item.quantidadeIdeal}, ${item.variacaoAceita} ),`;
                }
                sql = sql.slice(0, -1) + ';';
                await banco.executa(sql);
            }
        } catch (ex) {
            _manipulaError('Erro ao inserir Material Lista Tarefas', ex, sql);
        }

    }

    var _popularFabricantes = async function (output) {
        try {

            var sql = 'DELETE FROM fabricante WHERE 1';
            await banco.executa(sql);

            if (output.fabricantes && output.fabricantes.length) {
                var sql = 'INSERT INTO fabricante (id, nome) VALUES ';
                for (var i = 0; i < output.fabricantes.length; i++) {
                    var item = {};
                    item = output.fabricantes[i];
                    sql += ` (${item.id},  ${item.nome}),`;
                }
                sql = sql.slice(0, -1) + ';';
                await banco.executa(sql);
            } else {
                var sql = 'INSERT INTO fabricante (id, nome) VALUES ';
                for (var i = 0; i < 10; i++) {
                    var item = {};
                    item.id = i;
                    item.nome = "Fabricante " + i;
                    sql += ` (${item.id},  '${item.nome}'),`;
                }
                sql = sql.slice(0, -1) + ';';
                await banco.executa(sql);
            }
        } catch (ex) {
            _manipulaError('Erro ao inserir Fabricante', ex, sql);
        }

    }

    var _popularSolicitacoesMaterial = async function (output) {
        try {

            var sql = 'DELETE FROM solicitacao_material where sync = 1';
            await banco.executa(sql);


            if (output.lancamentoSolicitacaoMateriais) {

                output.lancamentoSolicitacaoMateriais = Array.from(output.lancamentoSolicitacaoMateriais);
                if (output.lancamentoSolicitacaoMateriais.length) {

                    var sql = 'INSERT INTO solicitacao_material (id, data_solicitacao, patrimonio_id, mecanico_id, cod_fabricante, foto, json, sync, updated) VALUES';
                    for (let i = 0; i < output.lancamentoSolicitacaoMateriais.length; i++) {
                        var material = {};
                        material = output.lancamentoSolicitacaoMateriais[i];
                        let patrimonio = material.patrimonio ? material.patrimonio.id : 0;
                        let mecanico = material.solicitante ? material.solicitante.id : 0;


                        sql += ` (${material.id}, '${material.dataDaSolicitacao}', '${patrimonio}', '${mecanico}', '${material.codfabricante}', '${material.foto}', '${JSON.stringify(material)}', 1, 0),`;

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

    var _popularControleContaminacoes = async function (output) {
        try {

            var sql = 'DELETE FROM controle_contaminacao WHERE sync = 1';
            await banco.executa(sql);


            if (output.lancamentoControleContaminacoes) {

                output.lancamentoControleContaminacoes = Array.from(output.lancamentoControleContaminacoes);
                if (output.lancamentoControleContaminacoes.length) {

                    var sql = 'INSERT INTO controle_contaminacao (id, data, patrimonio_id, mecanico_id, medicao, medicao_ideal, data_anterior, medicao_anterior, delphID, sync, updated,usuario_id, json) VALUES';
                    for (let i = 0; i < output.lancamentoControleContaminacoes.length; i++) {
                        var controle = {};

                        controle = output.lancamentoControleContaminacoes[i];
                        let patrimonio = controle.patrimonio ? controle.patrimonio.id : 0;
                        let mecanico = controle.mecanico ? controle.mecanico.id : 0;
                        let usuario = controle.usuario ? controle.usuario.id : 0;

                        sql += ` (${controle.delphID}, '${controle.data}', ${patrimonio}, '${mecanico}', '${controle.medicao}', '${controle.medicaoIdeal}', '${controle.dataAnterior}', ${controle.medicaoAnterior}, ${controle.delphID}, 1, 0,'${usuario}', '${JSON.stringify(controle)}'),`;

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




    var _cadastrarTabelas = async function () {

        try {


            var sql = `CREATE TABLE IF NOT EXISTS mecanico (id INTEGER PRIMARY KEY AUTOINCREMENT, delphID INTERGER, nome TEXT);`;
            var params = [];
            await banco.executa(sql, params);

            var sql = `CREATE TABLE IF NOT EXISTS checklist_item (id INTEGER PRIMARY KEY AUTOINCREMENT, delphID INTERGER, nome TEXT);`;
            var params = [];
            await banco.executa(sql, params);

            var sql = `CREATE TABLE IF NOT EXISTS checklist (id INTEGER PRIMARY KEY AUTOINCREMENT, tipo INTERGER, delphID INTERGER, patrimonio_id INTERGER, sync INTEGER, updated INTEGER, json TEXT);`;
            var params = [];
            await banco.executa(sql, params);

            var sql = `CREATE TABLE IF NOT EXISTS checklist_operacao (id INTEGER PRIMARY KEY AUTOINCREMENT, patrimonio_id INTERGER, operador_id INTERGER, data INTERGER, delphID INTERGER, sync INTEGER, updated INTEGER, json TEXT);`;
            var params = [];
            await banco.executa(sql, params);

            var sql = `CREATE TABLE IF NOT EXISTS checklist_mecanico (id INTEGER PRIMARY KEY AUTOINCREMENT, patrimonio_id INTERGER, operador_id INTERGER, mecanico_id INTERGER, data INTERGER, delphID INTERGER, sync INTEGER, updated INTEGER, json TEXT);`;
            var params = [];
            await banco.executa(sql, params);

            var sql = `CREATE TABLE IF NOT EXISTS controle_contaminacao (id INTEGER PRIMARY KEY AUTOINCREMENT,data INTEGER, patrimonio_id INTERGER, mecanico_id INTERGER, medicao FLOAT, medicao_ideal FLOAT, data_anterior INTEGER, medicao_anterior FLOAT, delphID INTEGER, sync INTEGER, updated INTEGER,usuario_id INTEGER);`;
            var params = [];
            await banco.executa(sql, params);

            try {
                var sql = `ALTER TABLE controle_contaminacao ADD json TEXT `;
                await banco.executa(sql);
            } catch (e) {
                console.warn('Essa coluna já foi adicionada: json,tabela : controle_contaminacao');
            }

            var sql = `CREATE TABLE IF NOT EXISTS material_ordem_servico (id INTEGER PRIMARY KEY AUTOINCREMENT, descricao TEXT, unidade_id TEXT, unidade_nome TEXT, quantidade INTEGER, codfabricante INTEGER);`;
            var params = [];
            await banco.executa(sql, params);



            var sql = `CREATE TABLE IF NOT EXISTS tipo_ordem_servico (id INTEGER PRIMARY KEY AUTOINCREMENT, json TEXT);`;
            var params = [];
            await banco.executa(sql, params);

            var sql = `CREATE TABLE IF NOT EXISTS tipo_atividade (id INTEGER PRIMARY KEY AUTOINCREMENT, json TEXT);`;
            var params = [];
            await banco.executa(sql, params);

            var sql = `CREATE TABLE IF NOT EXISTS sintoma (id INTEGER PRIMARY KEY AUTOINCREMENT, descricao TEXT);`;
            var params = [];
            await banco.executa(sql, params);

            var sql = `CREATE TABLE IF NOT EXISTS causa (id INTEGER PRIMARY KEY AUTOINCREMENT, descricao TEXT);`;
            var params = [];
            await banco.executa(sql, params);

            var sql = `CREATE TABLE IF NOT EXISTS solucao (id INTEGER PRIMARY KEY AUTOINCREMENT, descricao TEXT);`;
            var params = [];
            await banco.executa(sql, params);

            var sql = `CREATE TABLE IF NOT EXISTS parte_objeto (id INTEGER PRIMARY KEY AUTOINCREMENT, json TEXT);`;
            var params = [];
            await banco.executa(sql, params);
            console.log('atualizando banco');
            try {
                var sql = `ALTER TABLE parte_objeto ADD sistema_parte_objeto INTEGER `;
                await banco.executa(sql);
            } catch (e) {
                console.warn('Essa coluna já foi adicionada: sistema_parte_objeto,tabela : parte_objeto');
            }

            var sql = `CREATE TABLE IF NOT EXISTS sistema_parte_objeto (id INTEGER PRIMARY KEY AUTOINCREMENT, json TEXT);`;
            var params = [];
            await banco.executa(sql, params);

            var sql = `CREATE TABLE IF NOT EXISTS centro_trabalho (id INTEGER PRIMARY KEY AUTOINCREMENT, json TEXT);`;
            var params = [];
            await banco.executa(sql, params);

            var sql = `CREATE TABLE IF NOT EXISTS solicitacao_manutencao (id INTEGER PRIMARY KEY AUTOINCREMENT, tipo INTEGER, patrimonio_id INTERGER, operador_id INTERGER, data INTERGER, delphID INTERGER, sync INTEGER, updated INTEGER, json TEXT);`;
            var params = [];
            await banco.executa(sql, params);

            var sql = `CREATE TABLE IF NOT EXISTS tipo_nota (id INTEGER PRIMARY KEY AUTOINCREMENT, json TEXT);`;
            var params = [];
            await banco.executa(sql, params);

            try {
                var sql = `ALTER TABLE solicitacao_manutencao ADD finalizado INTEGER DEFAULT 0 `;
                await banco.executa(sql);
            } catch (e) {
                console.warn('Essa coluna já foi adicionada: finalizado,tabela : solicitacao_manutencao');
            }

            try {
                var sql = `ALTER TABLE solicitacao_manutencao ADD controle_contaminacao INTEGER`;
                await banco.executa(sql);
            } catch (e) {
                console.warn('Essa coluna já foi adicionada: controle_contaminacao,tabela : solicitacao_manutencao');
            }

            try {
                var sql = `ALTER TABLE solicitacao_manutencao ADD ordem_de_servico INTEGER`;
                await banco.executa(sql);
            } catch (e) {
                console.warn('Essa coluna já foi adicionada: ordem_de_servico,tabela : solicitacao_manutencao');
            }

            try {
                var sql = `ALTER TABLE solicitacao_manutencao ADD operacao_os INTEGER`;
                await banco.executa(sql);
            } catch (e) {
                console.warn('Essa coluna já foi adicionada: operacao_os,tabela : solicitacao_manutencao');
            }

            var sql = `CREATE TABLE IF NOT EXISTS solicitacao_manutencao_dado_tecnico (id INTEGER PRIMARY KEY AUTOINCREMENT, solicitacao_manutencao_id INTEGER, delphID INTERGER, sync INTEGER, updated INTEGER, json TEXT);`;
            var params = [];
            await banco.executa(sql, params);

            var sql = `CREATE TABLE IF NOT EXISTS prioridade (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT, codigosap TEXT);`;
            var params = [];
            await banco.executa(sql, params);

            var sql = `CREATE TABLE IF NOT EXISTS lista_de_tarefa (id INTEGER PRIMARY KEY AUTOINCREMENT, descricao INTEGER, modelo, INTEGER);`;
            var params = [];
            await banco.executa(sql, params);

            var sql = `CREATE TABLE IF NOT EXISTS ordem_de_servico (id INTEGER PRIMARY KEY AUTOINCREMENT, delphID INTERGER, data INTEGER, data_inicio INTEGER, data_fim INTEGER, status TEXT, patrimonio_id INTEGER, mecanico_id INTEGER, tipo_ordem_id INTEGER,  fotos TEXT, json TEXT, sync INTEGER, updated INTEGER);`;
            var params = [];
            await banco.executa(sql, params);

            try {
                var sql = `ALTER TABLE ordem_de_servico ADD numeroSap TEXT`;
                await banco.executa(sql);
            } catch (e) {
                console.warn('Essa coluna já foi adicionada: numeroSap,tabela : ordem_de_servico');
            }


            var sql = `CREATE TABLE IF NOT EXISTS modelo_lista_tarefas (modeloid INTERGER, listaid INTERGER);`;
            var params = [];
            await banco.executa(sql, params);

            var sql = `CREATE TABLE IF NOT EXISTS material_lista_tarefas (modeloid INTERGER, listaid INTERGER, materialid INTERGER, quantidade INTEGER, variacao TEXT);`;
            var params = [];
            await banco.executa(sql, params);

            var sql = `CREATE TABLE IF NOT EXISTS solicitacao_material (id INTEGER PRIMARY KEY AUTOINCREMENT, data_solicitacao INTEGER, patrimonio_id INTEGER, mecanico_id INTEGER, cod_fabricante TEXT, foto TEXT, json TEXT, sync INTEGER, updated INTEGER);`;
            var params = [];
            await banco.executa(sql, params);

            var sql = `CREATE TABLE IF NOT EXISTS fabricante (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT);`;
            var params = [];
            await banco.executa(sql, params);



        } catch (ex) {
            console.log(ex);
            _manipulaError('Erro criar tabelas para o módulo de MANUTENÇÃO!', ex);
        }
    }

    var _checklistOperacoes = async function () {


        try {
            var sql = 'SELECT * FROM checklist_operacao WHERE sync = 0 OR sync IS NULL';
            var resultado = await banco.executa(sql);

            var lista = Array.from(resultado.rows);
            var checklists = [];
            for (var i = 0; i < lista.length; i++) {
                var item = lista[i];
                var checklist = JSON.parse(item.json);
                checklist.id = item.id;
                checklists.push(checklist);
            }

            return checklists;

        } catch (ex) {
            _manipulaError('Erro ao selecionar checklist operacoes', ex, sql);
        }

    }

    var _checklistMecanicos = async function () {


        try {
            var sql = 'SELECT * FROM checklist_mecanico WHERE sync = 0 OR sync IS NULL';
            var resultado = await banco.executa(sql);

            var lista = Array.from(resultado.rows);
            var checklists = [];
            for (var i = 0; i < lista.length; i++) {
                var item = lista[i];
                var checklist = JSON.parse(item.json);
                console.log(checklist);
                checklist.id = item.id;
                checklists.push(checklist);
            }

            return checklists;

        } catch (ex) {
            _manipulaError('Erro ao selecionar checklist mecanico', ex, sql);
        }

    }

    var _controleContaminacoes = async function () {


        try {
            var sql = 'SELECT * FROM controle_contaminacao WHERE sync = 0 OR sync IS NULL';
            var resultado = await banco.executa(sql);

            var lista = Array.from(resultado.rows);
            var contaminacoes = [];
            for (var i = 0; i < lista.length; i++) {
                var item = lista[i];
                var contaminacao = JSON.parse(item.json);
                contaminacao.id = item.id;
                contaminacoes.push(contaminacao);
            }

            return contaminacoes;

        } catch (ex) {
            _manipulaError('Erro ao selecionar controle_contaminacao', ex, sql);
        }

    }

    var _solicitacaoManutencao = async function () {


        try {
            var sql = 'SELECT * FROM solicitacao_manutencao WHERE sync = 0 OR sync IS NULL';
            var resultado = await banco.executa(sql);

            var lista = Array.from(resultado.rows);
            var solicitacoes = [];
            for (var i = 0; i < lista.length; i++) {
                var item = lista[i];
                var solicitacao = JSON.parse(item.json);
                solicitacao.id = item.id;
                solicitacao.data = new Date(item.data);
                solicitacao.dataAvaria = new Date(solicitacao.dataAvaria);
                solicitacoes.push(solicitacao);
            }

            return solicitacoes;

        } catch (ex) {
            _manipulaError('Erro ao selecionar solicitacao de manutencao', ex, sql);
        }

    }

    var _ponto = async function () {


        try {
            var sql = 'SELECT * FROM ponto_manutencao WHERE sync = 0 OR sync IS NULL';
            var resultado = await banco.executa(sql);

            var lista = Array.from(resultado.rows);
            var ponto = [];
            for (var i = 0; i < lista.length; i++) {
                var item = lista[i];
                ponto.push(item);
            }

            return ponto;

        } catch (ex) {
            _manipulaError('Erro ao selecionar ponto', ex, sql);
        }

    }

    var _solicitacaoMaterial = async function () {


        try {
            var sql = 'SELECT * FROM solicitacao_material WHERE sync = 0 OR sync IS NULL';
            var resultado = await banco.executa(sql);

            var lista = Array.from(resultado.rows);
            var solicitacoes = [];
            for (var i = 0; i < lista.length; i++) {
                var item = lista[i];
                var solicitacao = JSON.parse(item.json);
                solicitacao.id = item.id;
                solicitacao.data = new Date(item.data_solicitacao);
                solicitacoes.push(solicitacao);
            }

            return solicitacoes;

        } catch (ex) {
            _manipulaError('Erro ao selecionar solicitacao de Material', ex, sql);
        }

    }

    var _OrdensDeServico = async function () {

        try {
            var sql = 'SELECT * FROM ordem_de_servico WHERE sync = 0 OR sync IS NULL or updated = 1';
            var resultado = await banco.executa(sql);

            var lista = Array.from(resultado.rows);
            var ordens = [];
            for (var i = 0; i < lista.length; i++) {
                var item = lista[i];
                var ordem = JSON.parse(item.json);
                console.log(item);
                var data = new Date(item.data_inicio);
                console.log(data.getHours() + ':' + data.getMinutes() + ':' + data.getSeconds());
                ordem.dataTeste = data.getHours() + ':' + data.getMinutes() + ':' + data.getSeconds();
                ordem.id = item.id;
                ordens.push(ordem);
            }
            return ordens;
        } catch (ex) {
            _manipulaError('Erro ao selecionar ordens de serviço', ex, sql);
        }

    }

    var _updateSolicitacaoMaterial = async function (output) {
        try {
            if (output.solicitacaoMaterial && output.solicitacaoMaterial.length) {
                var sql = '';
                var ids = '';
                for (var i = 0; i < Array.from(output.solicitacaoMaterial).length; i++) {
                    ids += `${parseInt(output.solicitacaoMaterial[i].idMobile)},`;
                }
                ids = ids.slice(0, -1) + '';
                sql += ` update solicitacao_material set sync = 1 where id in(${ids});`;
                await banco.executa(sql);
            }
        } catch (ex) {
            _manipulaError('Erro ao atualizar solicitacao material', ex, sql);
        }
    }

    var _updateChecklistOperacoes = async function (output) {
        try {
            if (output.checkListOperacao && output.checkListOperacao.length) {
                var sql = '';
                var ids = '';
                for (var i = 0; i < Array.from(output.checkListOperacao).length; i++) {
                    ids += `${parseInt(output.checkListOperacao[i].idMobile)},`;
                }
                ids = ids.slice(0, -1) + '';
                sql += ` update checklist_operacao set sync = 1 where id in(${ids});`;
                await banco.executa(sql);
            }
        } catch (ex) {
            _manipulaError('Erro ao atualizar checklist_operacao', ex, sql);
        }
    }

    var _updateChecklistMecanicos = async function (output) {
        try {
            if (output.checklistMecanicos && output.checklistMecanicos.length) {
                var sql = '';
                var ids = '';
                for (var i = 0; i < Array.from(output.checklistMecanicos).length; i++) {
                    ids += `${parseInt(output.checklistMecanicos[i].idMobile)},`;
                }
                ids = ids.slice(0, -1) + '';
                sql += ` update checklist_mecanico set sync = 1 where id in(${ids});`;
                await banco.executa(sql);
            }
        } catch (ex) {
            _manipulaError('Erro ao atualizar checklist_mecanico', ex, sql);
        }
    }

    var _updateControleContaminacoes = async function (output) {
        try {
            if (output.controleContaminacoes && output.controleContaminacoes.length) {
                var sql = '';
                var ids = '';
                for (var i = 0; i < Array.from(output.controleContaminacoes).length; i++) {
                    ids += `${parseInt(output.controleContaminacoes[i].idMobile)},`;
                }
                ids = ids.slice(0, -1) + '';
                sql += ` update controle_contaminacao set sync = 1 where id in(${ids});`;
                await banco.executa(sql);
            }
        } catch (ex) {
            _manipulaError('Erro ao atualizar controle_contaminacao', ex, sql);
        }
    }

    var _updateSolicitacoesManutencoes = async function (output) {
        try {
            if (output.solicitacoesManutencoes && output.solicitacoesManutencoes.length) {
                var sql = '';
                var ids = '';
                for (var i = 0; i < Array.from(output.solicitacoesManutencoes).length; i++) {
                    ids += `${parseInt(output.solicitacoesManutencoes[i].idMobile)},`;
                }
                ids = ids.slice(0, -1) + '';
                sql += ` update solicitacao_manutencao set sync = 1 where id in(${ids});`;
                await banco.executa(sql);
            }
        } catch (ex) {
            _manipulaError('Erro ao atualizar solicitacao_manutencao', ex, sql);
        }
    }

    var _updateOrdemServicos = async function (output) {
        try {
            if (output.ordemServicos && output.ordemServicos.length) {
                var sql = '';
                var ids = '';
                for (var i = 0; i < Array.from(output.ordemServicos).length; i++) {
                    ids += `${parseInt(output.ordemServicos[i].idMobile)},`;
                }
                ids = ids.slice(0, -1) + '';
                sql += ` update ordem_de_servico set sync = 1, updated = 0 where id in(${ids});`;
                await banco.executa(sql);
            }
        } catch (ex) {
            _manipulaError('Erro ao atualizar ordem_de_servico', ex, sql);
        }
    }

    var _updateSolicitacaoMateriais = async function (output) {
        try {
            if (output.solicitacaoMaterial && output.solicitacaoMaterial.length) {
                var sql = '';
                var ids = '';
                for (var i = 0; i < Array.from(output.solicitacaoMaterial).length; i++) {
                    ids += `${parseInt(output.solicitacaoMaterial[i].idMobile)},`;
                }
                ids = ids.slice(0, -1) + '';
                sql += ` update solicitacao_material set sync = 1 where id in(${ids});`;
                await banco.executa(sql);
            }
        } catch (ex) {
            _manipulaError('Erro ao atualizar solicitacao_material', ex, sql);
        }
    }


    var _updatePonto = async function (output) {
        try {
            if (output.pontoManutencao && output.pontoManutencao.length) {
                var sql = '';
                var ids = '';
                for (var i = 0; i < Array.from(output.pontoManutencao).length; i++) {
                    ids += `${parseInt(output.pontoManutencao[i].id)},`;
                }
                ids = ids.slice(0, -1) + '';
                sql += ` update ponto_manutencao set sync = 1 where id in(${ids});`;
                await banco.executa(sql);
            }
        } catch (ex) {
            _manipulaError('Erro ao atualizar ponto_manutencao', ex, sql);
        }
    }

    $scope.subirManutencao = async function () {

        try {
            _inicioLoad(true);

            //var input = new Input();
            var input = {};
            input.mobileID = device.uuid;
            input.checklistOperacoes = await _checklistOperacoes();
            input.checklistMecanicos = await _checklistMecanicos();
            input.controleContaminacoes = await _controleContaminacoes();
            input.solicitacoesManutencoes = await _solicitacaoManutencao();
            input.ordemServicos = await _OrdensDeServico();
            input.solicitacaoMateriais = await _solicitacaoMaterial();
            input.pontoManutencao = await _ponto();

            var resultado = await banco.executa('SELECT * FROM config_ip');
            var ip = Array.from(resultado.rows)[0].ip;

            //console.log(input);

            $scope.$parent.sincronizar(1);
            var retorno = await $http.post(_pegarRota(ip, 'POST'), input);
            await _updateSolicitacaoMaterial(retorno.data);
            await _updateChecklistOperacoes(retorno.data);
            await _updateChecklistMecanicos(retorno.data);
            await _updateControleContaminacoes(retorno.data);
            await _updateSolicitacoesManutencoes(retorno.data);
            await _updateOrdemServicos(retorno.data);
            await _updateSolicitacaoMateriais(retorno.data);
            await _updatePonto(retorno.data);
            //_fimLoad();
        } catch (ex) {
            _manipulaError('Erro ao enviar dados de Manutenção!', ex);
        }
    }

    var _inserirChecklistOperacao = async function (output) {
        try {


            if (output.lancamentoCheckListOperacoes && output.lancamentoCheckListOperacoes.length) {

                var inserir = false;
                var atualizar = false;

                var sync = {};
                var sqlUpdate = null;

                var sqlInserir = 'INSERT INTO checklist_operacao (patrimonio_id, operador_id, data, delphID, sync, updated, json) VALUES ';
                for (var i = 0; i < output.lancamentoCheckListOperacoes.length; i++) {

                    //var item = new ChecklistOperacao();
                    var item = {};
                    item = output.lancamentoCheckListOperacoes[i];

                    var patrimonio = item.patrimonio && item.patrimonio.id ? item.patrimonio.id : null;
                    var operador = item.operador && item.operador.id ? item.operador.id : null;
                    var data = new Date(item.data);
                    item.id = null;

                    var sql = 'SELECT * FROM checklist_operacao WHERE delphID = ? AND updated = ?';
                    var params = [item.delphID, 0];

                    var resultado = await banco.executa(sql, params);
                    var busca = Array.from(resultado.rows);

                    if (busca.length) {
                        if (busca[0].sync === sync.ENVIADO) { // SE JÁ FOI ENVIADO É PQ FOI MESCLADO
                            atualizar = true;

                            if (!sqlUpdate) {
                                sqlUpdate = '';
                            }

                            sqlUpdate += `UPDATE checklist_operacao SET patrimonio_id = ${patrimonio}, operador_id = ${operador}, data = ${data.getTime()}, sync = ${sync.MESCLADO}, json = '${JSON.stringify(item)}' WHERE delphID = ${item.delphID};`;
                        }

                    } else {
                        inserir = true;
                        sqlInserir += ` (${patrimonio},  ${operador}, ${data.getTime()}, ${item.delphID}, 1, 0, '${JSON.stringify(item)}'),`;
                    }
                }


                if (inserir) {
                    sqlInserir = sqlInserir.slice(0, -1) + ';';
                    await banco.executa(sqlInserir);
                }

                if (atualizar) {
                    await banco.executa(sqlUpdate);
                }

            }

        } catch (ex) {
            _manipulaError('Erro ao inserir Checklist Mecânico', ex, sqlInserir + sqlUpdate);
        }

    }

    $scope.baixarManutencao = async function () {

        try {
            _inicioLoad();
            await _cadastrarTabelas();
            /* verifica se tem algum lançamento para subir */
            var checklistOperacoes = await _checklistOperacoes();
            var checklistMecanicos = await _checklistMecanicos();
            var controleContaminacoes = await _controleContaminacoes();
            var solicitacoesManutencoes = await _solicitacaoManutencao();
            var ordemServicos = await _OrdensDeServico();
            var solicitacaoMateriais = await _solicitacaoMaterial();
            console.log(checklistOperacoes.length);
            console.log(checklistMecanicos.length);
            console.log(controleContaminacoes.length);
            console.log(solicitacoesManutencoes.length);
            console.log(ordemServicos.length);
            console.log(solicitacaoMateriais.length);
            if (checklistOperacoes.length > 0 || checklistMecanicos.length > 0 || controleContaminacoes.length > 0 ||
                solicitacoesManutencoes.length > 0 || ordemServicos.length > 0 || solicitacaoMateriais.length > 0) {
                alert('Existe lançamento que precisa ser sincronizado');
                _fimLoad();
            } else {


                $scope.$parent.sincronizar(0);

                var resultadoSelect = await banco.executa('SELECT * FROM config_ip');
                var ip = Array.from(resultadoSelect.rows)[0].ip;

                var resultado = await $http.get(_pegarRota(ip, 'GET'));
                //var output = new Output();
                var output = {};
                output = resultado.data;

                await _popularChecklist(output);
                await _popularChecklistItens(output);
                await _popularMecanicos(output);
                await _popularMateriais(output);
                await _popularPrioridades(output);
                await _popularTipoNota(output);
                await _popularTipoOrdem(output);
                await _popularTipoAtividade(output);
                await _popularSintomas(output);
                await _popularCausas(output);
                await _popularSolucoes(output);
                await _popularParteObjeto(output);
                await _popularSistemaParteObjeto(output);
                await _popularCentrosDeTrabalho(output);
                await _popularOrdensDeServico(output);
                await _popularListaDeTarefa(output);
                await _popularMaterialListaTarefas(output);
                await _popularFabricantes(output);
                await _popularSolicitacoesManutencao(output);
                await _popularSolicitacoesMaterial(output);
                await _popularControleContaminacoes(output);

                await _inserirChecklistOperacao(output);
            }

            //_fimLoad();

        } catch (ex) {
            _manipulaError('Erro ao baixar dados!', ex);
        }
    }

});