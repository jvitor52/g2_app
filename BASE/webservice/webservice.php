<?php

header("Access-Control-Allow-Origin: *");

require __DIR__ . '/Conexao.php';

function encodificaUTF8(&$lista) {
    return array_map(function($tupla) {
        $tupla->nome = utf8_encode($tupla->nome);
        return $tupla;
    }, $lista);
}

function preparaInteiroParaJellyBean($string) {
    if (!$string)
        return null;

    return (int) $string;
}

function doCheckbox($valor) {
    return ($valor === 'true') ? 1 : 0;
}

function dataJSParaMysql($jsData) {
    $data = DateTime::createFromFormat('D M d Y H:i:s T +', $jsData);
    return $data ? $data->format('Y-m-d H:i:s') : null;
}

function horaJSParaMysql($jsData) {
    $data = DateTime::createFromFormat('D M d Y H:i:s T +', $jsData);

    return $data ? $data->format('H:i:s') : null;
}

function sincroniaStatus($tabela, $id) {
    $sincronia = new stdClass();

    $sincronia->tabela = $tabela;
    $sincronia->id = $id;

    return $sincronia;
}

$conexao = new Conexao();

/*  VERIFICA A MATRICULA */
if (isset($_POST['matricula'])) {
    $output = new stdClass();

    $sql = 'SELECT * FROM matricula WHERE matricula = :matricula;';

    $resultado = $conexao->executaSQL($sql, ['matricula' => $_POST['matricula']]);


    if (empty($resultado)) {
        $output->matriculado = false;
        die(json_encode($output));
    }

    $output->matriculado = true;
}

/* INCLUS�O */ else if (isset($_POST['data'])) {

//RECEP��O DOS INPUTS
    $input = json_decode($_POST['data']);


    //verifica a matricula
    $sql = 'SELECT * FROM matricula WHERE matricula = :matricula';
    $acesso = $conexao->executaSQL($sql, ['matricula' => $input->matricula]);


//SAIDA DE DADOS
    $output = new stdClass();
    $output->sincronizou = [];

//bloqueia o acesso
    if (empty($acesso)) {
        $output->mensagem = utf8_encode('Matr�cula Inv�lida');
        die(json_encode($output));
    }

//define matricula
    $matricula = $acesso[0];

//ALIMENTANDO A BASE
//controle_diario
    $listaControleDiario = $input->controleDiario;

    foreach ($listaControleDiario as $controleDiario) {
        $sql = 'INSERT INTO lanca_diario_prod (`codigo`, `data`, `projeto_id`, `fazenda_id`, `projeto_estrutural_id`, `talhao_id`, `operacao_id`, `unidade_id`, `volume`, `faixa_id`, `observacao`, `id_mobile`, `matricula_id`, `empresa_main`) 
                               VALUES (:codigo, :data, :projeto_id, :fazenda_id, :projeto_estrutural_id, :talhao_id, :operacao_id, :unidade_id, :volume, :faixa_id, :observacao, :id_mobile, :matricula_id, :empresa_main);';

        $parametros = [];
        $parametros['codigo'] = $controleDiario->codigo;
        $parametros['data'] = dataJSParaMysql($controleDiario->data);
        $parametros['projeto_id'] = preparaInteiroParaJellyBean($controleDiario->projeto_execucao);
        $parametros['fazenda_id'] = preparaInteiroParaJellyBean($controleDiario->fazenda);
        $parametros['projeto_estrutural_id'] = preparaInteiroParaJellyBean($controleDiario->projeto_estrutural);
        $parametros['talhao_id'] = preparaInteiroParaJellyBean($controleDiario->talhao);
        $parametros['operacao_id'] = preparaInteiroParaJellyBean($controleDiario->operacao);
        $parametros['unidade_id'] = preparaInteiroParaJellyBean($controleDiario->unidade);
        $parametros['volume'] = $controleDiario->volume;
        $parametros['faixa_id'] = preparaInteiroParaJellyBean($controleDiario->faixa);
        $parametros['observacao'] = $controleDiario->observacao;
        $parametros['id_mobile'] = preparaInteiroParaJellyBean($controleDiario->id);
        $parametros['matricula_id'] = preparaInteiroParaJellyBean($matricula->id);
        $parametros['empresa_main'] = preparaInteiroParaJellyBean($controleDiario->empresa_main);

        $gravou = $conexao->crudSQL($sql, $parametros);


        if ($gravou) {
            $output->sincronizou[] = sincroniaStatus('controle_diario', $controleDiario->id);
        }
    }

//controle_diario_componente
    $listaControleDiarioComponente = $input->controleDiarioComponente;

    foreach ($listaControleDiarioComponente as $componente) {

        //mantendo a consistencia de dados
        $sql = 'SELECT * FROM lanca_diario_prod WHERE id_mobile = :id AND matricula_id = :matricula;';
        $parametros = [
            'id' => $componente->controle_diario_id,
            'matricula' => $matricula->id,
        ];

        $resultado = $conexao->executaSQL($sql, $parametros);



        //verifica se tem relacionamento
        if (count($resultado)) {
            $controleDiario = end($resultado);

            $sql = 'INSERT INTO lanca_comp_diario (`fornecedor_id`, `componente_id`, `qtd_pagamento`, `horas`, `lanca_diario_prod_id`, `id_mobile`, `matricula_id` ) 
                                   VALUES (:fornecedor_id, :componente_id, :qtd_pagamento, :horas, :lanca_diario_prod_id, :id_mobile, :matricula_id);';


            $parametros = [];
            $parametros['fornecedor_id'] = preparaInteiroParaJellyBean($componente->fornecedor_id);
            $parametros['componente_id'] = preparaInteiroParaJellyBean($componente->componente_id);
            $parametros['qtd_pagamento'] = $componente->qtd_pagamento;
            $parametros['horas'] = $componente->horas;
            $parametros['lanca_diario_prod_id'] = preparaInteiroParaJellyBean($controleDiario->id);
            $parametros['id_mobile'] = preparaInteiroParaJellyBean($componente->id);
            $parametros['matricula_id'] = preparaInteiroParaJellyBean($matricula->id);

            $gravou = $conexao->crudSQL($sql, $parametros);

            if ($gravou) {
                $output->sincronizou[] = sincroniaStatus('controle_diario_componente', $componente->id);
            }
        }
    }

//controle_diario_insumo
    $listaControleDiarioInsumo = $input->controleDiarioInsumo;

    foreach ($listaControleDiarioInsumo as $insumo) {

        //mantendo a consistencia de dados
        $sql = 'SELECT * FROM lanca_diario_prod WHERE id_mobile = :id AND matricula_id = :matricula;';
        $parametros = [
            'id' => $insumo->controle_diario_id,
            'matricula' => $matricula->id,
        ];

        $resultado = $conexao->executaSQL($sql, $parametros);



        //verifica se tem relacionamento
        if (count($resultado)) {
            $controleDiario = end($resultado);

            $sql = 'INSERT INTO `florestal`.`lanca_insumo_diario_prod` (`material_id`, `unidade_id`, `quantidade`, `lanca_diario_prod_id`, `id_mobile`, `matricula_id`)
                                                                   VALUES (:material_id, :unidade_id, :quantidade, :lanca_diario_prod_id, :id_mobile, :matricula_id);';



            $parametros = [];
            $parametros['material_id'] = preparaInteiroParaJellyBean($insumo->insumo);
            $parametros['unidade_id'] = preparaInteiroParaJellyBean($insumo->unidade);
            $parametros['quantidade'] = $insumo->quantidade;
            $parametros['lanca_diario_prod_id'] = preparaInteiroParaJellyBean($controleDiario->id);
            $parametros['id_mobile'] = preparaInteiroParaJellyBean($insumo->id);
            $parametros['matricula_id'] = preparaInteiroParaJellyBean($matricula->id);

            $gravou = $conexao->crudSQL($sql, $parametros);

            if ($gravou) {
                $output->sincronizou[] = sincroniaStatus('controle_diario_insumo', $insumo->id);
            }
        }
    }

    //materiais_insumo
    $listaMaterialInsumo = $input->materiaisInsumos;

    foreach ($listaMaterialInsumo as $materialInsumo) {
        $sql = 'INSERT INTO mov_almoxarifado (`fazenda`, `projeto_estrutural`, `talhao`, `cod_saida`, `data`, `responsavel_id`, `produto_id`, `unidade_id`, `qtd_volume`, `centro_resultado_id`, `projeto_id`, `patrimonio_id`, `funcionario_id`, `id_mobile`, `matricula_id`, `empresa_main`) 
                                        VALUES (:fazenda, :projeto_estrutural, :talhao, :cod_saida, :data, :responsavel_id, :produto_id, :unidade_id, :qtd_volume, :centro_resultado_id, :projeto_id, :patrimonio_id, :funcionario_id, :id_mobile, :matricula_id, :empresa_main);';

        $parametros = [];
        $parametros['fazenda'] = preparaInteiroParaJellyBean($materialInsumo->fazenda);
        $parametros['projeto_estrutural'] = preparaInteiroParaJellyBean($materialInsumo->projeto_estrutural);
        $parametros['talhao'] = preparaInteiroParaJellyBean($materialInsumo->talhao);
        $parametros['cod_saida'] = $materialInsumo->codigo;
        $parametros['data'] = dataJSParaMysql($materialInsumo->data);
        $parametros['responsavel_id'] = preparaInteiroParaJellyBean($materialInsumo->responsavel);
        $parametros['produto_id'] = preparaInteiroParaJellyBean($materialInsumo->material);
        $parametros['unidade_id'] = preparaInteiroParaJellyBean($materialInsumo->unidade);
        $parametros['qtd_volume'] = $materialInsumo->quantidade;
        $parametros['centro_resultado_id'] = preparaInteiroParaJellyBean($materialInsumo->cr);
        $parametros['projeto_id'] = preparaInteiroParaJellyBean($materialInsumo->projeto);
        $parametros['patrimonio_id'] = preparaInteiroParaJellyBean($materialInsumo->patrimonio);
        $parametros['funcionario_id'] = preparaInteiroParaJellyBean($materialInsumo->funcionario);
        $parametros['id_mobile'] = preparaInteiroParaJellyBean($materialInsumo->id);
        $parametros['matricula_id'] = preparaInteiroParaJellyBean($matricula->id);
        $parametros['empresa_main'] = preparaInteiroParaJellyBean($materialInsumo->empresa_main);


        $gravou = $conexao->crudSQL($sql, $parametros);

        if ($gravou) {
            $output->sincronizou[] = sincroniaStatus('materiais_insumos', $materialInsumo->id);
        }
    }

    //os

    $listaOs = $input->os;

    foreach ($listaOs as $os) {
        $sql = 'INSERT INTO lanca_os_mecanica (`codigo`, `data_entrada_oficina`, `data_abertura`, `hora_entrada_oficina`, `patrimonio_id`, `vida_hora_patrimonio`, `motivo_abertura_os_id`, `vida_km_patrimonio`, `agente_causador_id`, `operacao_id`, `tipo_os_id`, `centro_resultado_id`, `funcionario_id`, `hora_abertura`, `observacao`, `id_mobile`, `matricula_id`, `empresa_main`)
                                                     VALUES (:codigo, :data_entrada_oficina, :data_abertura, :hora_entrada_oficina, :patrimonio_id, :vida_hora_patrimonio, :motivo_abertura_os_id, :vida_km_patrimonio, :agente_causador_id, :operacao_id, :tipo_os_id, :centro_resultado_id, :funcionario_id, :hora_abertura, :observacao, :id_mobile, :matricula_id, :empresa_main);';

        $parametros = [];
        $parametros['codigo'] = $os->codigo;
        $parametros['data_entrada_oficina'] = dataJSParaMysql($os->dataoficina);
        $parametros['data_abertura'] = dataJSParaMysql($os->data);
        $parametros['hora_entrada_oficina'] = horaJSParaMysql($os->horaoficina);
        $parametros['patrimonio_id'] = preparaInteiroParaJellyBean($os->patrimonio);
        $parametros['vida_hora_patrimonio'] = $os->vidahora;
        $parametros['motivo_abertura_os_id'] = preparaInteiroParaJellyBean($os->motivo);
        $parametros['vida_km_patrimonio'] = $os->vidakm;
        $parametros['agente_causador_id'] = preparaInteiroParaJellyBean($os->agente);
        $parametros['operacao_id'] = preparaInteiroParaJellyBean($os->operacao);
        $parametros['tipo_os_id'] = preparaInteiroParaJellyBean($os->tipo);
        $parametros['centro_resultado_id'] = preparaInteiroParaJellyBean($os->centro);
        $parametros['funcionario_id'] = preparaInteiroParaJellyBean($os->funcionario);
        $parametros['hora_abertura'] = horaJSParaMysql($os->hora);
        $parametros['observacao'] = $os->observacao;
        $parametros['id_mobile'] = preparaInteiroParaJellyBean($os->id);
        $parametros['matricula_id'] = preparaInteiroParaJellyBean($matricula->id);
        $parametros['empresa_main'] = preparaInteiroParaJellyBean($os->empresa_main);


        $gravou = $conexao->crudSQL($sql, $parametros);

        if ($gravou) {
            $output->sincronizou[] = sincroniaStatus('os', $os->id);
        }
    }


    //os_servico
    $listaOsServico = $input->osServico;

    foreach ($listaOsServico as $osServico) {


        //mantendo a consistencia de dados
        $sql = 'SELECT * FROM lanca_os_mecanica WHERE id_mobile = :id AND matricula_id = :matricula;';
        $parametros = [
            'id' => $osServico->os_id,
            'matricula' => $matricula->id,
        ];

        $resultado = $conexao->executaSQL($sql, $parametros);



        //verifica se tem relacionamento
        if (count($resultado)) {
            $os = end($resultado);


            $sql = 'INSERT INTO servico_os (`codigo`, `servico_manutencao_id`, `qtd`, `duracao_prevista`, `compartimento_id`, `sistema_id`, `oficina_id`, `observacao`, `lanca_os_mecanica_id`, `id_mobile` , `matricula_id`)
                                              VALUES (:codigo, :servico_manutencao_id, :qtd, :duracao_prevista, :compartimento_id, :sistema_id, :oficina_id, :observacao, :lanca_os_mecanica_id, :id_mobile, :matricula_id);';

            $parametros = [];
            $parametros['codigo'] = $osServico->codigo;
            $parametros['servico_manutencao_id'] = preparaInteiroParaJellyBean($osServico->manutencao);
            $parametros['qtd'] = $osServico->quantidade;
            $parametros['duracao_prevista'] = $osServico->duracao;
            $parametros['compartimento_id'] = preparaInteiroParaJellyBean($osServico->compartimento);
            $parametros['sistema_id'] = preparaInteiroParaJellyBean($osServico->sistema);
            $parametros['oficina_id'] = preparaInteiroParaJellyBean($osServico->oficina);
            $parametros['observacao'] = $osServico->observacao;
            $parametros['lanca_os_mecanica_id'] = preparaInteiroParaJellyBean($os->id);
            $parametros['id_mobile'] = preparaInteiroParaJellyBean($osServico->id);
            $parametros['matricula_id'] = preparaInteiroParaJellyBean($matricula->id);

            $gravou = $conexao->crudSQL($sql, $parametros);

            if ($gravou) {
                $output->sincronizou[] = sincroniaStatus('os_servico', $osServico->id);
            }
        }
    }

    //apontar_mecanico
    $listaApontamentoMecanico = $input->apontarMecanico;

    foreach ($listaApontamentoMecanico as $mecanico) {

        //mantendo a consistencia de dados
        $sql = 'SELECT * FROM servico_os WHERE id_mobile = :id AND matricula_id = :matricula;';
        $parametros = [
            'id' => $mecanico->os_servico_id,
            'matricula' => $matricula->id,
        ];

        $resultado = $conexao->executaSQL($sql, $parametros);



        //verifica se tem relacionamento
        if (count($resultado)) {
            $osServico = end($resultado);



            $sql = 'INSERT INTO servico_os_mecanico (`funcionario_id`, `hora_inicio`, `hora_final`, `motivo_parada_id`, `finalizado`, `data`, `servico_os_id`, `id_mobile` , `matricula_id`)
                                                       VALUES (:funcionario_id, :hora_inicio, :hora_final, :motivo_parada_id, :finalizado, :data, :servico_os_id, :id_mobile, :matricula_id);';

            $parametros = [];

            $parametros['funcionario_id'] = preparaInteiroParaJellyBean($mecanico->funcionario);
            $parametros['hora_inicio'] = horaJSParaMysql($mecanico->inicio);
            $parametros['hora_final'] = horaJSParaMysql($mecanico->fim);
            $parametros['motivo_parada_id'] = preparaInteiroParaJellyBean($mecanico->parada);
            $parametros['finalizado'] = doCheckBox($mecanico->finalizado);
            $parametros['data'] = dataJSParaMysql($mecanico->data);
            $parametros['servico_os_id'] = preparaInteiroParaJellyBean($osServico->id);

            $parametros['id_mobile'] = preparaInteiroParaJellyBean($mecanico->id);
            $parametros['matricula_id'] = preparaInteiroParaJellyBean($matricula->id);


            $gravou = $conexao->crudSQL($sql, $parametros);

            if ($gravou) {
                $output->sincronizou[] = sincroniaStatus('apontar_mecanico', $mecanico->id);
            }
        }
    }


    //apontamento_material
    $listaApontamentoMaterial = $input->apontamentoMaterial;

    foreach ($listaApontamentoMaterial as $material) {

        //mantendo a consistencia de dados
        $sql = 'SELECT * FROM servico_os WHERE id_mobile = :id AND matricula_id = :matricula;';
        $parametros = [
            'id' => $material->os_servico_id,
            'matricula' => $matricula->id,
        ];

        $resultado = $conexao->executaSQL($sql, $parametros);



        //verifica se tem relacionamento
        if (count($resultado)) {
            $osServico = end($resultado);

            $sql = 'INSERT INTO servico_os_materiais (`codigo`, `funcionario_id`, `material_id`, `qtd`, `obsevacao`, `servico_os_id`, `id_mobile`, `matricula_id`)
                                          VALUES (:codigo, :funcionario_id, :material_id, :qtd, :obsevacao, :servico_os_id, :id_mobile, :matricula_id);';

            $parametros = [];
            $parametros['codigo'] = $material->codigo;
            $parametros['funcionario_id'] = preparaInteiroParaJellyBean($material->funcionario);
            $parametros['material_id'] = preparaInteiroParaJellyBean($material->material);
            $parametros['qtd'] = $material->quantidade;
            $parametros['obsevacao'] = $material->observacao;
            $parametros['servico_os_id'] = preparaInteiroParaJellyBean($osServico->id);

            $parametros['id_mobile'] = preparaInteiroParaJellyBean($material->id);
            $parametros['matricula_id'] = preparaInteiroParaJellyBean($matricula->id);


            $gravou = $conexao->crudSQL($sql, $parametros);

            if ($gravou) {
                $output->sincronizou[] = sincroniaStatus('apontamento_material', $material->id);
            }
        }
    }




    //lancamento
    $listaLancamento = $input->lancamento;



    foreach ($listaLancamento as $lancamento) {


        $sql = 'INSERT INTO lanca_producao_operacao (`codigo`, `fazenda_id`, `data`, `projeto_id`, `turno_id`, `talhao_id`, `operadores_maquina_id`, `horimetro_ini`, `horimetro_fim`, `hora_ini`, `hora_fim`, `volume`, `mes_ano_id`, `fustes`, `observacao`, `patrimonio_id`, `falha_mecanica`, `manutencao_operacional_id`, `finaliza_talhao`, `id_mobile`, `matricula_id`, `empresa_main`) 
                                                           VALUES (:codigo, :fazenda_id, :data, :projeto_id, :turno_id, :talhao_id, :operadores_maquina_id, :horimetro_ini, :horimetro_fim, :hora_ini, :hora_fim, :volume, :mes_ano_id, :fustes, :observacao, :patrimonio_id, :falha_mecanica, :manutencao_operacional_id, :finaliza_talhao, :id_mobile, :matricula_id, :empresa_main);';

        $parametros = [];
        $parametros['codigo'] = $lancamento->codigo;
        $parametros['fazenda_id'] = preparaInteiroParaJellyBean($lancamento->fazenda);
        $parametros['data'] = dataJSParaMysql($lancamento->data);
        $parametros['projeto_id'] = preparaInteiroParaJellyBean($lancamento->projeto);
        $parametros['turno_id'] = preparaInteiroParaJellyBean($lancamento->turno);
        $parametros['talhao_id'] = preparaInteiroParaJellyBean($lancamento->talhao);
        $parametros['operadores_maquina_id'] = preparaInteiroParaJellyBean($lancamento->operador);
        $parametros['horimetro_ini'] = $lancamento->horimetroi;
        $parametros['horimetro_fim'] = $lancamento->horimetrof;
        $parametros['hora_ini'] = horaJSParaMysql($lancamento->horai);
        $parametros['hora_fim'] = horaJSParaMysql($lancamento->horaf);
        $parametros['volume'] = $lancamento->volume;
        $parametros['mes_ano_id'] = preparaInteiroParaJellyBean($lancamento->mesano);
        $parametros['fustes'] = $lancamento->fustes;
        $parametros['observacao'] = $lancamento->observacao;
        $parametros['patrimonio_id'] = preparaInteiroParaJellyBean($lancamento->patrimonio);
        $parametros['falha_mecanica'] = doCheckbox($lancamento->mecanicaf);
        $parametros['manutencao_operacional_id'] = preparaInteiroParaJellyBean($lancamento->tipo);
        $parametros['finaliza_talhao'] = doCheckbox($lancamento->finalizar);
        $parametros['id_mobile'] = preparaInteiroParaJellyBean($lancamento->id);
        $parametros['matricula_id'] = preparaInteiroParaJellyBean($matricula->id);
        $parametros['empresa_main'] = preparaInteiroParaJellyBean($lancamento->empresa_main);


        $gravou = $conexao->crudSQL($sql, $parametros);

        if ($gravou) {
            $output->sincronizou[] = sincroniaStatus('lancamento', $lancamento->id);
        }
    }



    //parada
    $listaParada = $input->parada;

    foreach ($listaParada as $parada) {

        //mantendo a consistencia de dados
        $sql = 'SELECT * FROM lanca_producao_operacao WHERE id_mobile = :id AND matricula_id = :matricula;';
        $parametros = [
            'id' => $parada->lancamento_id,
            'matricula' => $matricula->id,
        ];

        $resultado = $conexao->executaSQL($sql, $parametros);



        //verifica se tem relacionamento
        if (count($resultado)) {
            $lancamento = end($resultado);

            $sql = 'INSERT INTO lanca_horas_paradas (`hora_ini`, `hora_fim`, `motivo_parada_id`, `observacao`, `lanca_producao_operacao_id`, `id_mobile`, `matricula_id`) 
                                            VALUES (:hora_ini, :hora_fim, :motivo_parada_id, :observacao, :lanca_producao_operacao_id, :id_mobile, :matricula_id);';

            $parametros = [];
            $parametros['hora_ini'] = horaJSParaMysql($parada->horai);
            $parametros['hora_fim'] = horaJSParaMysql($parada->horaf);
            $parametros['motivo_parada_id'] = preparaInteiroParaJellyBean($parada->motivo);
            $parametros['observacao'] = $parada->observacao;
            $parametros['lanca_producao_operacao_id'] = preparaInteiroParaJellyBean($lancamento->id);

            $parametros['id_mobile'] = preparaInteiroParaJellyBean($parada->id);
            $parametros['matricula_id'] = preparaInteiroParaJellyBean($matricula->id);

            $gravou = $conexao->crudSQL($sql, $parametros);

            if ($gravou) {
                $output->sincronizou[] = sincroniaStatus('parada', $parada->id);
            }
        }
    }

    /*     * **HD7*** */

    //transporte
    $listaTransporte = $input->transporte;



    foreach ($listaTransporte as $transporte) {


        $sql = 'INSERT INTO tr_floresta_box_lenha (`fator`,`media`,`veiculo_id`, `talhao_id`, `data`, `hora`, `vol_lenha_m3`, `vol_lenha_st`, `tamanho_lenha_id`, `box_origem_madeira_id`, `box_destino_id`, `largura`, `comprimento`, `id_mobile`, `matricula_id`, `upc_id`)  
                VALUES (:fator,:media,:veiculo_id, :talhao_id, :data, :hora, :vol_lenha_m3, :vol_lenha_st, :tamanho_lenha_id, :box_origem_madeira_id, :box_destino_id, :largura, :comprimento, :id_mobile, :matricula_id, :upc);';

        $parametros = [];

        $parametros['fator'] = $transporte->fator;
        $parametros['media'] = $transporte->lancamento;
        $parametros['veiculo_id'] = preparaInteiroParaJellyBean($transporte->placa);
        $parametros['talhao_id'] = preparaInteiroParaJellyBean($transporte->talhao);
        $parametros['data'] = dataJSParaMysql($transporte->data);
        $parametros['hora'] = horaJSParaMysql($transporte->hora);
        $parametros['vol_lenha_m3'] = $transporte->volume_madeira;
        $parametros['vol_lenha_st'] = $transporte->volume_madeira_st;
        $parametros['tamanho_lenha_id'] = preparaInteiroParaJellyBean($transporte->bitola);
        $parametros['box_origem_madeira_id'] = preparaInteiroParaJellyBean($transporte->origem);
        $parametros['box_destino_id'] = preparaInteiroParaJellyBean($transporte->box);
        $parametros['largura'] = $transporte->largura;
        $parametros['comprimento'] = $transporte->comprimento;
        $parametros['id_mobile'] = preparaInteiroParaJellyBean($transporte->id);
        $parametros['matricula_id'] = preparaInteiroParaJellyBean($matricula->id);
        $parametros['upc'] = preparaInteiroParaJellyBean($transporte->upc);

        $gravou = $conexao->crudSQL($sql, $parametros);



        if ($gravou) {
            $output->sincronizou[] = sincroniaStatus('transporte', $transporte->id);
        }
    }

    //altura
    $listaAltura = $input->alturas;



    foreach ($listaAltura as $altura) {

        //mantendo a consistencia de dados
        $sql = 'SELECT * FROM tr_floresta_box_lenha WHERE id_mobile = :id AND matricula_id = :matricula;';
        $parametros = [
            'id' => $altura->transporte_id,
            'matricula' => $matricula->id,
        ];

        $resultado = $conexao->executaSQL($sql, $parametros);



        //verifica se tem relacionamento
        if (count($resultado)) {
            $transporte = end($resultado);


            $sql = 'INSERT INTO tr_floresta_box_lenha_altura (`tr_floresta_box_lenha_id`,`altura`,`id_mobile`,`matricula_id`)  
                VALUES (:tr_floresta_box_lenha_id,:altura, :id_mobile, :matricula_id);';

            $parametros = [];

            $parametros['tr_floresta_box_lenha_id'] = preparaInteiroParaJellyBean($transporte->id);
            $parametros['altura'] = $altura->altura;


            $parametros['id_mobile'] = preparaInteiroParaJellyBean($altura->id);
            $parametros['matricula_id'] = preparaInteiroParaJellyBean($matricula->id);


            $gravou = $conexao->crudSQL($sql, $parametros);



            if ($gravou) {
                $output->sincronizou[] = sincroniaStatus('altura', $altura->id);
            }
        }
    }


    //enfornamento
    $listaEnfornamento = $input->enfornamento;


    foreach ($listaEnfornamento as $enfornamento) {


        $sql = 'INSERT INTO tr_box_lenha_forno (`data_entrada_forno`, `box_origem_id`, `forno_destino_id`, `lenha_enfornada_m3`, `lenha_enfornada_st`, `tico_m3`, `tico_enfornado`, `umidade`, `id_mobile`, `matricula_id`, `upc_id`)
                VALUES (:data_entrada_forno, :box_origem_id, :forno_destino_id, :lenha_enfornada_m3, :lenha_enfornada_st, :tico_m3, :tico_enfornado, :umidade, :id_mobile, :matricula_id, :upc);
';

        $parametros = [];

        $parametros['data_entrada_forno'] = dataJSParaMysql($enfornamento->data);
        $parametros['box_origem_id'] = preparaInteiroParaJellyBean($enfornamento->box);
        $parametros['forno_destino_id'] = preparaInteiroParaJellyBean($enfornamento->forno);
        $parametros['lenha_enfornada_m3'] = $enfornamento->madeiraem;
        $parametros['lenha_enfornada_st'] = $enfornamento->madeiraest;
        $parametros['tico_m3'] = $enfornamento->tem;
        $parametros['tico_enfornado'] = $enfornamento->tes;
        $parametros['umidade'] = $enfornamento->umidade;
        $parametros['id_mobile'] = preparaInteiroParaJellyBean($enfornamento->id);
        $parametros['matricula_id'] = preparaInteiroParaJellyBean($matricula->id);
        $parametros['upc'] = preparaInteiroParaJellyBean($enfornamento->upc);

        $gravou = $conexao->crudSQL($sql, $parametros);



        if ($gravou) {
            $output->sincronizou[] = sincroniaStatus('enfornamento', $enfornamento->id);
        }
    }

    //descarga
    $listaDescarga = $input->descarga;


    foreach ($listaDescarga as $descarga) {


        $sql = 'INSERT INTO tr_forno_box_carvao (`data_saida`, `forno_id`, `box_destino_id`, `vol_carvao_para_rendimento`, `densidade`, `tico_gerado`, `id_mobile`, `matricula_id`, `upc_id`)
                VALUES (:data_saida, :forno_id, :box_destino_id, :vol_carvao_para_rendimento, :densidade, :tico_gerado, :id_mobile, :matricula_id, :upc);';


        $parametros = [];

        $parametros['data_saida'] = dataJSParaMysql($descarga->data);
        $parametros['forno_id'] = preparaInteiroParaJellyBean($descarga->forno);
        $parametros['box_destino_id'] = preparaInteiroParaJellyBean($descarga->box);
        $parametros['vol_carvao_para_rendimento'] = $descarga->volume;
        $parametros['densidade'] = $descarga->densidade;
        $parametros['tico_gerado'] = $descarga->tico;
        $parametros['id_mobile'] = preparaInteiroParaJellyBean($descarga->id);
        $parametros['matricula_id'] = preparaInteiroParaJellyBean($matricula->id);
        $parametros['upc'] = preparaInteiroParaJellyBean($descarga->upc);


        $gravou = $conexao->crudSQL($sql, $parametros);


        if ($gravou) {
            $output->sincronizou[] = sincroniaStatus('descarga', $descarga->id);
        }
    }

    //expedicao
    $listaExpedicao = $input->expedicao;

    foreach ($listaExpedicao as $expedicao) {


        $sql = 'INSERT INTO `expedicao_box_c_siderurgica` (`placa_id`, `peso`, `tipo_expedicao_id`, `data`, `hora`, `data_saida`, `hora_saida`, `hora_ini_carregamento`, `hora_fim_carregamento`, `cliente_id`, `volume_m3`, `id_mobile`, `matricula_id`, `upc_id`)
                VALUES (:placa_id,:peso, :tipo_expedicao_id, :data, :hora, :data_saida, :hora_saida, :hora_ini_carregamento, :hora_fim_carregamento, :cliente_id, :volume_m3, :id_mobile, :matricula_id, :upc);';


        $parametros = [];

        $parametros['placa_id'] = preparaInteiroParaJellyBean($expedicao->placa);
        $parametros['peso'] = $expedicao->peso;
        $parametros['tipo_expedicao_id'] = preparaInteiroParaJellyBean($expedicao->tipo_expedicao);
        $parametros['data'] = dataJSParaMysql($expedicao->datae);
        $parametros['hora'] = dataJSParaMysql($expedicao->horae);
        $parametros['data_saida'] = dataJSParaMysql($expedicao->datas);
        $parametros['hora_saida'] = dataJSParaMysql($expedicao->horas);
        $parametros['hora_ini_carregamento'] = horaJSParaMysql($expedicao->inicio);
        $parametros['hora_fim_carregamento'] = horaJSParaMysql($expedicao->fim);
        $parametros['cliente_id'] = preparaInteiroParaJellyBean($expedicao->cliente);
        $parametros['volume_m3'] = $expedicao->volume;
        $parametros['id_mobile'] = preparaInteiroParaJellyBean($expedicao->id);
        $parametros['matricula_id'] = preparaInteiroParaJellyBean($matricula->id);
        $parametros['upc'] = preparaInteiroParaJellyBean($expedicao->upc);

        $gravou = $conexao->crudSQL($sql, $parametros);

        if ($gravou) {
            $output->sincronizou[] = sincroniaStatus('expedicao', $expedicao->id);
        }
    }



    //box
    $listaBox = $input->box;



    foreach ($listaBox as $box) {

        //mantendo a consistencia de dados
        $sql = 'SELECT * FROM expedicao_box_c_siderurgica WHERE id_mobile = :id AND matricula_id = :matricula;';
        $parametros = [
            'id' => $box->expedicao_id,
            'matricula' => $matricula->id,
        ];

        $resultado = $conexao->executaSQL($sql, $parametros);



        //verifica se tem relacionamento
        if (count($resultado)) {
            $expedicao = end($resultado);


            $sql = 'INSERT INTO `expedicao_box_carvao` (`box_carvao_id`, `volume_m3`, `expedicao_box_c_siderurgica_id`, `id_mobile`, `matricula_id`)
                    VALUES (:box_carvao_id, :volume_m3, :expedicao_box_c_siderurgica_id, :id_mobile, :matricula_id);';

            $parametros = [];

            $parametros['expedicao_box_c_siderurgica_id'] = preparaInteiroParaJellyBean($expedicao->id);
            $parametros['box_carvao_id'] = preparaInteiroParaJellyBean($box->box_carvao);
            $parametros['volume_m3'] = $box->volumebox;


            $parametros['id_mobile'] = $box->id;
            $parametros['matricula_id'] = $matricula->id;


            $gravou = $conexao->crudSQL($sql, $parametros);



            if ($gravou) {
                $output->sincronizou[] = sincroniaStatus('box', $box->id);
            }
        }
    }

    /*     * **HD7 FIM*** */
}

/* RECEBIMENTO */


if (isset($_GET['recebimento'])) {

    $sql = 'SELECT * FROM material';
    $output->insumo = $conexao->executaSQL($sql);
    encodificaUTF8($output->insumo);

    $sql = 'SELECT * FROM upc';
    $output->upc = $conexao->executaSQL($sql);
    encodificaUTF8($output->upc);

    $sql = 'SELECT * FROM fazenda';
    $output->fazenda = $conexao->executaSQL($sql);
    encodificaUTF8($output->fazenda);

    $sql = 'SELECT * FROM faixa';
    $output->faixa = $conexao->executaSQL($sql);
    encodificaUTF8($output->faixa);

    $sql = 'SELECT * FROM unidade';
    $output->unidade_medida = $conexao->executaSQL($sql);
    encodificaUTF8($output->unidade_medida);

    $sql = 'SELECT * FROM fator_empilhamento';
    $output->fator_empilhamento = $conexao->executaSQL($sql);

    $sql = 'SELECT * FROM fornecedor';
    $output->fornecedor = $conexao->executaSQL($sql);
    encodificaUTF8($output->fornecedor);

    $sql = 'SELECT * FROM componente';
    $output->componente = $conexao->executaSQL($sql);
    encodificaUTF8($output->componente);

    $sql = 'SELECT * FROM empresa';
    $output->empresa = $conexao->executaSQL($sql);
    encodificaUTF8($output->empresa);

    $sql = 'SELECT * FROM projeto';
    $output->projeto = $conexao->executaSQL($sql);
    encodificaUTF8($output->projeto);

    $output->projeto_execucao = $output->projeto;

    $sql = 'SELECT * FROM projeto_estrutural';
    $output->projeto_estrutural = $conexao->executaSQL($sql);
    encodificaUTF8($output->projeto_estrutural);

    $sql = 'SELECT * FROM talhao';
    $output->talhao = $conexao->executaSQL($sql);
    encodificaUTF8($output->talhao);

    $sql = 'SELECT * FROM operacao';
    $output->operacao = $conexao->executaSQL($sql);
    encodificaUTF8($output->operacao);

    $sql = 'SELECT * FROM patrimonio';
    $output->patrimonio = $conexao->executaSQL($sql);
    encodificaUTF8($output->patrimonio);

    $sql = 'SELECT * FROM centro_resultado';
    $output->centro_resultado = $conexao->executaSQL($sql);
    encodificaUTF8($output->centro_resultado);

    $sql = 'SELECT * FROM funcionario';
    $output->funcionario = $conexao->executaSQL($sql);
    encodificaUTF8($output->funcionario);

    $sql = 'SELECT * FROM agente_causador';
    $output->agente_causador = $conexao->executaSQL($sql);
    encodificaUTF8($output->agente_causador);

    $sql = 'SELECT * FROM motivo_abertura_os';
    $output->motivo_abertura = $conexao->executaSQL($sql);
    encodificaUTF8($output->motivo_abertura);

    $sql = 'SELECT * FROM tipo_os';
    $output->tipo_os = $conexao->executaSQL($sql);
    encodificaUTF8($output->tipo_os);

    $sql = 'SELECT * FROM sistema';
    $output->sistema = $conexao->executaSQL($sql);
    encodificaUTF8($output->sistema);

    $sql = 'SELECT * FROM compartimento';
    $output->compartimento = $conexao->executaSQL($sql);
    encodificaUTF8($output->compartimento);

    $sql = 'SELECT * FROM oficina';
    $output->oficina = $conexao->executaSQL($sql);
    encodificaUTF8($output->oficina);

    $sql = 'SELECT * FROM servico_manutencao';
    $output->servico_manutencao = $conexao->executaSQL($sql);
    encodificaUTF8($output->servico_manutencao);

    $sql = 'SELECT * FROM motivo_parada_maquina';
    $output->motivo_parada = $conexao->executaSQL($sql);
    encodificaUTF8($output->motivo_parada);

    $sql = 'SELECT * FROM operadores_maquina';
    $output->operador = $conexao->executaSQL($sql);
    encodificaUTF8($output->operador);

    $sql = 'SELECT * FROM turno';
    $output->turno = $conexao->executaSQL($sql);
    encodificaUTF8($output->turno);

    $sql = 'SELECT * FROM mes_ano';
    $output->mes_ano = $conexao->executaSQL($sql);
    encodificaUTF8($output->mes_ano);

    $sql = 'SELECT * FROM manutencao_operacao';
    $output->tipo_parada = $conexao->executaSQL($sql);
    encodificaUTF8($output->tipo_parada);

    $sql = 'SELECT * FROM veiculo';
    $output->placa = $conexao->executaSQL($sql);
    encodificaUTF8($output->placa);

    $sql = 'SELECT * FROM box_lenha';
    $output->box_lenha = $conexao->executaSQL($sql);
    encodificaUTF8($output->box_lenha);

    $sql = 'SELECT * FROM box_carvao';
    $output->box_carvao = $conexao->executaSQL($sql);
    encodificaUTF8($output->box_carvao);

    $sql = 'SELECT * FROM tamanho_lenha';
    $output->tamanho_madeira = $conexao->executaSQL($sql);
    encodificaUTF8($output->tamanho_madeira);

    $sql = 'SELECT * FROM forno';
    $output->forno = $conexao->executaSQL($sql);
    encodificaUTF8($output->forno);

    $sql = 'SELECT * FROM tipo_expedicao';
    $output->tipo_expedicao = $conexao->executaSQL($sql);
    encodificaUTF8($output->tipo_expedicao);

    $sql = 'SELECT * FROM cliente';
    $output->cliente = $conexao->executaSQL($sql);
    encodificaUTF8($output->cliente);
}

if (isset($output)) {
    $output->mensagem = 'Sincronia Realizada com Sucesso!';
    echo json_encode($output);
} else {
    echo 'Área de testes';
}