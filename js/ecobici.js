/*---------*/
/*NAMESPACE*/
/*---------*/
var ecobici = {};

/*--------------*/
/*ABSTRACT CLASS*/
/*--------------*/
ecobici.Panel = {
	data : null,

	init: function(){},

	showNotifications: function(data){},

	runInterval: function(){},

	getData: function(){}
};

/*------*/
/*EVENTS*/
/*------*/
ecobici.Events = {
	STATIONS_BY_STATUS_LOADED: 'stationsByStatusLoaded',
};

/*------------*/
/*DATA MANAGER*/
/*------------*/
ecobici.DataManager = {
	URL_SERVICE: './service/ecobiciService.php',
	isWaiting:{
		stationsByStatus: false
	},

	init: function(){
		var t = this;
		t.getStationsByStatus('*');
	},
	getStationsByStatus: function(status){
		var t = this;
		if(!t.isWaiting.stationsByStatus){
			t.isWaiting.stationsByStatus = true;
			$.ajax({
				method: "POST",
				url: t.URL_SERVICE,
				data: { method: "getStationsByStatus", data: status },
				success: function(r){
					t.data = JSON.parse(r);
					//console.log(t.data);
					$(ecobici.DataManager).trigger(ecobici.Events.STATIONS_BY_STATUS_LOADED, [t.data]);
					t.isWaiting.stationsByStatus = false;
				},
				error: function(r){
					$('body').append('<p class="error">Error al cargar la informacion</p>')
					t.isWaiting.stationsByStatus = false;
				}
			})
		}
	}
};

/*---------*/
/*TOP PANEL*/
/*---------*/
ecobici.TopPanel = $.extend(true, {}, ecobici.Panel, {

	UPDATE_TIME: 5000, //ms
	data: null,
	isWaiting: false,
	interval: null,
	isRendered: false,
	status: '*',

	init: function(){
		console.log('TopPanel init');
		var t = this;

		$(ecobici.DataManager).on(ecobici.Events.STATIONS_BY_STATUS_LOADED, function(event, data) {
			t.updateBikesAvailable(data);
		});

		this.runInterval();

		//events
		$(window).on('resize', function(){
			t.updateBikesAvailable(ecobici.TopPanel.getData())
		})
	},
	setUpTopChart: function(d){
		var t = this;
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

		this.isRendered = true;
	},
	updateBikesAvailable: function(data){
		if(!ecobici.TopPanel.isRendered){
			ecobici.TopPanel.setUpTopChart(data);
		}
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
	runInterval: function(){
		var t = this;
		t.interval = setInterval(function(){
			ecobici.DataManager.getStationsByStatus(t.status);
			//console.log('Update request')
		},t.UPDATE_TIME);
	},
	showNotifications: function(data){
		//TODO
	},
	getData: function(){
		return this.data;
	}
});

/*-----------*/
/*RIGHT PANEL*/
/*-----------*/
ecobici.RightPanel = $.extend(true, {}, ecobici.Panel, {
	data : null,
	isRendered: false,

	init: function(){
		console.log('RightPanel init');
		var t = this;

		$(ecobici.DataManager).on(ecobici.Events.STATIONS_BY_STATUS_LOADED, function(event, data) {
			t.updateMap(data);
		});



		//this.runInterval();
	},
	loadData: function(callback){
		//uses the same data as TopPanel
		this.data = ecobici.TopPanel.getData();
		if(typeof callback != 'undefined'){
			for(var i = 0; i < callback.length; i++){
				callback[i](this.data);
			}
		};
	},
	printMap: function(data){

		var t = this;
		var data = data.features;
		t.map = new L.Map("graph-bottom-right", {center: [-34.6, -58.4], zoom: 11}).addLayer(new L.TileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"));

		//init svg layer from map
		t.map._initPathRoot();

		var geoSearchController = new L.Control.GeoSearch({
		    provider: new L.GeoSearch.Provider.OpenStreetMap()
		}).addTo(t.map);

		//select svg layer from map and append group
		var svg = d3.select("#graph-bottom-right").select("svg");
		var g = svg.append("g");
		//debugger;

		for(var i = 0; i < data.length; i++){
			(function(i){
				debugger;
				geoSearchController.geosearch('New York', function(results){
					console.log(results)
					var lat = results.Y;
					var lng = results.X;
					data[i].LatLng = new L.LatLng(lat, lng);
					console.log('se agrego la ');
				});
			})(i);
		}

		var circles = g.selectAll("circle")
			.data(data)
			.enter()
			.append("circle")
			.style("stroke", "black")
			.style("opacity", .6)
			.style("fill", "red")
			.attr({
				r: 20,//function(d){ return Math.sqrt(parseInt(d.properties.CantidadBicicletas)*0.0009); }, // not dynamic, resizes the dot based on 0.000X
				//fill: function(d){ return colorPicker(d.properties.CantidadBicicletas)},
				'class':'circle-station',
			});

		t.map.on("viewreset", ecobici.RightPanel.updateMap);

		ecobici.RightPanel.isRendered = true;
	},
	renderMap: function(data){
		var data = data.features;
		var $container = $('#graph-bottom-right');
		var container = '#graph-bottom-right';
		var margin = {top: 10, right: 10, bottom: 10, left: 10};
		var width = $container.width();
		var height = $container.height();
		var spacing = (0.3 / 100) * width; //0.2%
		var padding = 25;
		var tooltip = d3.select('#graph-top-tooltip');
		var t = this;

		// var projection = d3.geo.mercator() //.equirectangular() //.mercator()
		// 	.translate([width/2, height/2])
		// 	.scale([width]);

		// var path = d3.geo.path().projection(projection); // function

		var svg = d3.select(container)
			.append('svg')
			.attr({
				width : width,
				height : height
			});

		d3.json('/assets/json/caba.json', function(json){
			var center = d3.geo.centroid(json)
			var scale = 150;
			var offset = [width/2, height/2];
			var projection = d3.geo.mercator().scale(scale).center(center)
			    .translate(offset);

			// create the path
			var path = d3.geo.path().projection(projection);

			// using the path determine the bounds of the current map and use
			// these to determine better values for the scale and translation
			var bounds = path.bounds(json);
			var hscale = scale*width  / (bounds[1][0] - bounds[0][0]);
			var vscale = scale*height / (bounds[1][1] - bounds[0][1]);
			var scale = (hscale < vscale) ? hscale : vscale;
			var offset = [
				width - (bounds[0][0] + bounds[1][0])/2,
				height - (bounds[0][1] + bounds[1][1])/2
				];

			// new projection
			projection = d3.geo.mercator().center(center)
				.scale(scale).translate(offset);
			path = path.projection(projection);

			svg.selectAll("path").data(json.features).enter().append("path")
				.attr("d", path)
			    .style("fill", "#bdbdbd")
			    .style("stroke-width", "1")
			    .style("stroke", "rgba(0,0,0,0.5)");

			//debugger;
			//append circles
			// svg.selectAll('circle')
			// 	.data(data)
			// 	.enter()
			// 	.append('circle')
			// 	.attr({
			// 		cx : function(d){
			// 			var lon = d.geometry.coordinates[0];
			// 			var lat = d.geometry.coordinates[1];
			// 			var r = projection([lon, lat]);
			// 			if(r){
			// 				return r[0] //lon;
			// 			}
			// 		},
			// 		cy : function(d){
			// 			var lon = d.geometry.coordinates[0];
			// 			var lat = d.geometry.coordinates[1];
			// 			var r = projection([lon, lat]);
			// 			//debugger;
			// 			if(r){
			// 				return r[1] //lat;
			// 			}
			// 		},
			// 		r: function(d){ return Math.sqrt(parseInt(d.properties.CantidadBicicletas)*0.0009); }, // not dynamic, resizes the dot based on 0.000X
			// 		fill: function(d){ return colorPicker(d.properties.CantidadBicicletas)},
			// 		'class':'circle-station',
			// 	})
			// 	.on('mouseover',function(d){
			// 		d3.select(this).attr('class','hover');
			// 	})
			// 	.on('mouseout', function(d){
			// 		d3.select(this).classed("hover", false); //removeClass
			// 	});
				// .append('title')
				// .text(function(d){return d.city});
		});

		function colorPicker(v) {
			if(v==0){
				return '#de2d26';
			} else if(v<3) {
				return '#fe9929';
			} else if(v>=3 && v<=15) {
				return '#bdbdbd';
			} else if(v>15) {
				return '#31a354';
			}
		}

	},
	updateMap: function(data){
		// if(!ecobici.RightPanel.isRendered){
		// 	ecobici.RightPanel.renderMap(data);
		// }
		var t = this;
		if(!ecobici.RightPanel.isRendered){
			ecobici.RightPanel.printMap(data);
		}
		var svg = d3.select("#graph-bottom-right").select("svg");

		// var circles = svg.selectAll('circle.circle-station');
		// circles.data(data)
		// 	.enter()
		// 	.attr("transform", function(d) {
		// 		return "translate(" + t.map.latLngToLayerPoint(d.LatLng).x + "," + map.latLngToLayerPoint(d.LatLng).y +")";
		// 	});

		var circles = svg.select('g').selectAll('circle')
            .data(data);

	    // new data:
	    circles.enter()
	    	.append('circle')
	    	.attr("transform", function(d) {
				return "translate(" + t.map.latLngToLayerPoint(d.LatLng).x + "," + map.latLngToLayerPoint(d.LatLng).y +")";
			});
	},

	showNotifications: function(data){},

	getData: function(){}
});

{
	$(document).ready(function(){
		ecobici.DataManager.init();
		ecobici.TopPanel.init();
		ecobici.RightPanel.init();
	})
};
