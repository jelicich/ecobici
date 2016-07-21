var Ecobici = {
	
	//example http://epok.buenosaires.gob.ar/getObjectContent/?id=estaciones_de_bicicletas%7C6
	//URL_STATION: http://epok.buenosaires.gob.ar/getObjectContent/?id=estaciones_de_bicicletas%7C6,
	//URL_ECOBICI: 'http://epok.buenosaires.gob.ar/getGeoLayer/?categoria=estaciones_de_bicicletas&estado=*&formato=geojson',
	URL_SERVICE: '/service/ecobiciService.php',
	data: null,

	init: function(){
		console.log('Ecobici init');
		this.getStationsByStatus('*');	
	},
	getStationsByStatus: function(status){
		var t = this;
		$.ajax({
			method: "POST",
			url: this.URL_SERVICE,
			data: { method: "getStationsByStatus", data: status },
			success: function(r){
				t.data = JSON.parse(r);
				console.log(t.data)
				t.renderData(data);
			},
			error: function(r){
				$('body').append('<p class="error">Error al cargar la informacion</p>')
			}
		})
	},
	renderData: function(){
		
	}
};
{
	$(document).ready(function(){
		Ecobici.init();
	})
}