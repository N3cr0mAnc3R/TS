const app = new Vue({
	el: "#main-window",
	data: {
		people: [],
		currentFIO: "",
		filteredPeople: [],
		currentHuman: { disciplines: []},
		auditories: [],
		auditory: {},
		places: []
	},
	methods: {

		init: function () {

		},
		findByFIO: function () {
			var self = this;
			$.ajax({
				url: "/api/statistic/findfio",
				type: 'post',
				data: { Fio: self.currentFIO },
				success: function (data) {
					self.filteredPeople = data;
				}
			})
		},
		selectHuman: function (Id) {
			var self = this;
			$.ajax({
				url: "/api/statistic/getById?Id=" + Id,
				type: 'post',
				success: function (data) {
					self.currentHuman.disciplines = data;
					self.currentHuman.placeInfo =  { };
				}
			})
		},
		resetTP: function (item) {
			var self = this;
			$.ajax({
				url: "/api/statistic/resetProfile?Id=" + item.Id,
				type: 'post',
				success: function (data) {
					self.currentHuman.disciplines = data;
				}
			})
		},
		finishTP: function (item) {
			var self = this;
			$.ajax({
				url: "/api/statistic/finishProfile?Id=" + item.Id,
				type: 'post',
				success: function (data) {
					self.currentHuman.disciplines = data;
				}
			})
		},
		deleteTP: function (item) {
			var self = this;
			$.ajax({
				url: "/api/statistic/deleteProfile?Id=" + item.Id,
				type: 'post',
				success: function (data) {
					self.currentHuman.disciplines = data;
				}
			})
		},
		openNewPlaceWindow: function () {
			$('#place-window').modal('show');
			this.getCurrentPlace();
			this.getAuditoriums();
		},
		getCurrentPlace: function () {
			var self = this;
			$.ajax({
				url: "/api/statistic/getCurrentPlace?Id=" + self.currentHuman.Id,
				type: 'post',
				success: function (data) {
					self.currentHuman.placeInfo = data;
				}
			})
		},
		getAuditoriums: function () {
			var self = this;
			$.ajax({
				url: "/api/statistic/getAuditoryList",
				type: 'post',
				success: function (data) {
					self.auditories = data;
				}
			})
		},
		getAuditoryInfo: function (Id) {
			var self = this;
			$.ajax({
				url: "/api/statistic/getAuditoryById?Id=" + Id,
				type: 'post',
				success: function (data) {
					self.places = data;
				}
			})
		},
		setPlaceToUser: function (Id) {
			var self = this;
			$.ajax({
				url: "/api/statistic/setPlacetouser",
				type: 'post',
				data: {
					PlaceId: Id,
					UserId: self.currentHuman.Id
				},
				success: function (data) {
					self.currentHuman.placeInfo = data;
				},
				error: function () {
					//notifier('');
					notifier([{ Type: 'error', Body: 'Место занято' }]);
				}
			})
		}
	},
	mounted: function () {
	}
});
