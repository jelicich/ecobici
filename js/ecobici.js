
var Ecobici = {
	
	//URL_STATION: http://epok.buenosaires.gob.ar/getObjectContent/?id=estaciones_de_bicicletas%7C6,
	//URL_ECOBICI: 'http://epok.buenosaires.gob.ar/getGeoLayer/?categoria=estaciones_de_bicicletas&estado=*&formato=geojson',
	URL_SERVICE: '/service/ecobiciService.php',
	UPDATE_TIME: 5000, //ms
	data: null,
	isWaiting: false,

	init: function(){
		console.log('Ecobici init');
		var t = this;
		
		this.getStationsByStatus('*', [this.setUpTopChart]);

		var updateInterval = setInterval(function(){
			if(!t.isWaiting) {
				t.getStationsByStatus('*', [t.updateBikesAvailable, t.showNotifications]);
			}
		},t.UPDATE_TIME);

		//events
		$(window).on('resize', function(){
			t.updateBikesAvailable(Ecobici.getData())
		})
		
	},
	getStationsByStatus: function(status, callback){
		var t = this;
		t.isWaiting = true;
		$.ajax({
			method: "POST",
			url: this.URL_SERVICE,
			data: { method: "getStationsByStatus", data: status },
			success: function(r){
				t.data = JSON.parse(r);
				console.log(t.data)
				if(typeof callback != 'undefined'){
					for(var i = 0; i < callback.length; i++){
						callback[i](t.data);
					}
				};
				t.isWaiting = false;
			},
			error: function(r){
				$('body').append('<p class="error">Error al cargar la informacion</p>')
				t.isWaiting = false;
			}
		})
	},
	setUpTopChart: function(d){
		var data = d.features;
		var $container = $('#graph-top');
		var container = '#graph-top';
		var margin = {top: 10, right: 10, bottom: 10, left: 10};
		var width = $container.width();
		var height = $container.height();
		var spacing = 5;
		var padding = 25;

		//scales
		var xScale = d3.scale.ordinal()
			.domain(['Estaciones'])
		    .rangeRoundBands([0, width - padding - 1], .1);

		//var xTicks = xScale.domain().filter(function(d, i) { debugger; return d.properties.Nombre });
		var xAxisGen = d3.svg.axis()
		    .scale(xScale)
		    //.tickValues(xTicks)
		    .orient("bottom");

		var yScale = d3.scale.linear()
			.domain([
					0, 
					d3.max(data, function(d){ return d.properties.CantidadBicicletas; })
				])
			.range([height-padding,0]);

		var yAxisGen = d3.svg.axis()
				.scale(yScale)
				.orient('left');

		var svg = d3.select(container)
			.append('svg')
			.attr('width', width)
			.attr('height', height);

		var xAxis = svg.append('g').call(xAxisGen)
			.attr('class','x-axis')
			.attr('transform', 'translate(' + padding + ',' + (height-padding) +')');

		var yAxis = svg.append('g').call(yAxisGen)
			.attr('class','y-axis')
			.attr('transform', 'translate(' + padding +',0)'); //g is a group like a div to put elements in

		Ecobici.updateBikesAvailable(d);
	},
	updateBikesAvailable: function(data){
		var data = data.features;
		var $container = $('#graph-top');
		var container = '#graph-top';
		var margin = {top: 10, right: 10, bottom: 10, left: 10};
		var width = $container.width();
		var height = $container.height();
		var spacing = (0.3 / 100) * width; //0.2%
		var padding = 25;
		var tooltip = d3.select('#graph-top-tooltip');
		
		//scales
		var xScale = d3.scale.ordinal()
			.domain(['Estaciones'])
		    .rangeRoundBands([0, width - padding - 1], .1);

		//var xTicks = xScale.domain().filter(function(d, i) { debugger; return d.properties.Nombre });
		var xAxisGen = d3.svg.axis()
		    .scale(xScale)
		    //.tickValues(xTicks)
		    .orient("bottom");

		var yScale = d3.scale.linear()
			.domain([
					0, 
					d3.max(data, function(d){ return d.properties.CantidadBicicletas; })
				])
			.range([height-padding,0]);

		var yAxisGen = d3.svg.axis()
				.scale(yScale)
				.orient('left');

		var svg = d3.select(container).select('svg');

		//set size of svg so it works when it resizes the window
		svg.attr('width', width)
			.attr('height', height);

		//set attr transform so it works when it resizes the window
		var xAxis = svg.selectAll('g.x-axis').call(xAxisGen).attr('transform', 'translate(' + padding + ',' + (height-padding) +')');;
		var yAxis = svg.selectAll('g.y-axis').call(yAxisGen);
		//debugger;
		
		 var bar = svg.selectAll('.bar')
            .data(data);

	    // new data:
	    bar.enter().append('rect')
	    	.attr({
	    		'class': 'bar',
	    		x: function(d,i) { return (i * ((width-padding) / data.length)) + padding + spacing; },
	    		y: function(d) { return yScale(d.properties.CantidadBicicletas); },
	    		height: function(d) { return height - padding - yScale(d.properties.CantidadBicicletas); },
	    		width: (width / data.length) - spacing,
	    		fill: function(d){ return colorPicker(d.properties.CantidadBicicletas)}
	    	})
			.on('mouseover',function(d){	
				tooltip.select('.title').html(d.properties.Nombre);

				var color = colorPicker(d.properties.CantidadBicicletas);
				tooltip.select('.content').html('<ul><li><strong style="color:'+color+'">Cantidad: ' + d.properties.CantidadBicicletas + '</strong></li><li>Estado: ' + d.properties.Estado + '</li><li>Tipo de estación: ' + d.properties.Tipo + '</li></ul>');
				
				// tooltip.style('left', (d3.event.pageX)+'px')
				// 	.style('top', (d3.event.pageY - 68)+'px');

				tooltip.transition()
					.duration(200)
					.style('opacity',.85);
			})
			.on('mouseout',function(d){
				tooltip.transition()
					.duration(400)
					.style('opacity',0)
			});

	    // removed data:
	    bar.exit().remove();

	    // updated data:
	    bar.transition()
	    	.duration(500)
	    	.attr({
	    		x: function(d,i) { return (i * ((width-padding) / data.length)) + padding + spacing; },
	    		y: function(d) { return yScale(d.properties.CantidadBicicletas); },
	    		height: function(d) { return height - padding - yScale(d.properties.CantidadBicicletas); },
	    		width: (width / data.length) - spacing,
	    		fill: function(d){ return colorPicker(d.properties.CantidadBicicletas)}
	    	});

		//move the axis
		$('g.x-axis',$container).appendTo($container.find('svg'));
		$('g.y-axis',$container).appendTo($container.find('svg'));
		

		function colorPicker(v) {
			if(v<3) {
				return '#fe9929';
			} else if(v>=3 && v<=15) {
				return '#bdbdbd';
			} else if(v>15) {
				return '#31a354';
			}
		}
	},
	showNotifications: function(data){
		//TODO
	},
	getData: function(){
		return this.data;
	}
};
{
	$(document).ready(function(){
		Ecobici.init();
	})
}