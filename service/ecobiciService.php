<?php
class Ecobici_Service{
	//http://epok.buenosaires.gob.ar/getGeoLayer/?categoria=estaciones_de_bicicletas&formato=geojson&estado=*
	//http://epok.buenosaires.gob.ar/getObjectContent/?id=estaciones_de_bicicletas%7C6
	private $URL_ALL_STATIONS = 'http://epok.buenosaires.gob.ar/getGeoLayer/?categoria=estaciones_de_bicicletas&formato=geojson&estado=';
	private $URL_STATION_INFO = 'http://epok.buenosaires.gob.ar/getObjectContent/?id=';

	public function getData($url){
		
		$arrContextOptions=array(
		    "ssl"=>array(
		        "verify_peer"=>false,
		        "verify_peer_name"=>false,
		    ),
		    'http'=>array(
		    	'header' => "User-Agent:MyAgent/1.0\r\n"
		    )
		);  

		$json = file_get_contents($url, false, stream_context_create($arrContextOptions));
		return $json;

	}

	private function validate(){
		$result = true;
		if($_SERVER['REQUEST_METHOD'] != 'POST')
		{
			$result = false;
		} 
		else if(empty($_POST['data']) || empty($_POST['method']))
		{
			$result = false;	
		}
		
		return $result;
	}

	public function evalMethod(){
		if($this->validate())
		{
			$data = $_POST['data'];

			switch ($_POST['method']) {
				case 'getStationsByStatus':
					$url = $this->URL_ALL_STATIONS;
					break;

				case 'getStationById':
					$url = $this->URL_STATION_INFO;
					break;
			}
			$url = $url.$data;
			return $this->getData($url);
		}
		else
		{
			return '{error : "error validation"}';
		}
	}
}

$s = new Ecobici_Service();
$data = $s->evalMethod();
echo $data;
//var_dump($_POST);
//echo '{"type": "FeatureCollection", "features":[{"geometry":{"type": "Point", "coordinates": [106500.16143199999, 105115.884231]}, "type": "Feature", "id": "estaciones_de_bicicletas|1", "properties": {"Nombre": "1 - Facultad de Derecho", "Estado": "disponible", "Id": "estaciones_de_bicicletas|1", "Tipo": "automatica", "CantidadBicicletas": 54}},{"geometry": {"type": "Point", "coordinates": [106500.16143199999, 105115.884231]}, "type": "Feature","id": "estaciones_de_bicicletas|2","properties": {"Nombre": "2 - Retiro", "Estado": "disponible", "Id": "estaciones_de_bicicletas|2", "Tipo": "automatica", "CantidadBicicletas": 16}}]}';

?>