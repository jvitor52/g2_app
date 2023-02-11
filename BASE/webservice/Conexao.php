<?php

/**
 * 
 * Conex�o simples com PDO
 * @todo Implementar Camada de Seguran�a
 * @autor R�der Cantu�ria <dev.cantuaria@gmail.com>
 * 
 */
class Conexao {

    /**
     * @var PDO
     */
    private $pdo;

    public function __construct() {
        try {
            $this->pdo = new PDO("mysql:dbname=florestal;host=186.195.90.13;port=3315;", 'mobile', 'mobile4n1$');
            //$this->pdo = new PDO("mysql:dbname=florestal;host=localhost;port=3306;", 'root', 'xubuntu14');
        } catch (\PDOException $ex) {
            print($ex->getMessage());
        }
                
    }

    /**
     * Executa SQL com Par�metros
     * 
     * @param string $sql 
     * @param array $parametros
     * @return array
     */
    public function executaSQL($sql, $parametros = array()) {
        
        
        
        try {

            $query = $this->pdo->prepare($sql);

            foreach ($parametros as $chave => $parametro) {
                $query->bindValue(":$chave", $parametro);
            }


            $query->execute();

            return $query->fetchAll(PDO::FETCH_OBJ);
            
        } catch (PDOException $ex) {
            print($ex->getMessage());
        }
    }
    
    
    /**
     * Executa SQL com Par�metros
     * 
     * @param string $sql 
     * @param array $parametros
     * @return bool
     */
    public function crudSQL($sql, $parametros = array()) {
        
        
        
        try {

            $query = $this->pdo->prepare($sql);

            foreach ($parametros as $chave => $parametro) {
                $query->bindValue(":$chave", $parametro);
            }


            return $query->execute();

            
            
        } catch (PDOException $ex) {
            print($ex->getMessage());
        }
    }

}

?> 
