using Microsoft.AspNet.Identity.Owin;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;
using WebApp.Models;
using WebApp.Models.Common;

namespace WebApp.Controllers.Api
{
    [NotRedirectWebApiAuthorize]
    [RoutePrefix("api/statistic")]
    public class StatisticApiController : BaseApiController
    {
		[HttpPost]
		[Route("findfio")]
		public async Task<IHttpActionResult> findfio(TotalModel model)
		{
			return WrapResponse(await StatisticManager.FindFioByFamilyName(model.Fio, CurrentUser.Id));
		}
		[HttpPost]
		[Route("getById")]
		public async Task<IHttpActionResult> GetById(int Id)
		{
			return WrapResponse(await StatisticManager.GetUserById(Id, CurrentUser.Id));
		}
		[HttpPost]
		[Route("resetProfile")]
		public async Task<IHttpActionResult> ResetProfileBy(int Id)
		{
			return WrapResponse(await StatisticManager.ResetProfile(Id, CurrentUser.Id));
		}
		[HttpPost]
		[Route("finishProfile")]
		public async Task<IHttpActionResult> FinishProfile(int Id)
		{
			return WrapResponse(await StatisticManager.FinishProfile(Id, CurrentUser.Id));
		}
		[HttpPost]
		[Route("deleteProfile")]
		public async Task<IHttpActionResult> DeleteProfile(int Id)
		{
			try
			{
				await StatisticManager.DeleteProfile(Id, CurrentUser.Id);
				return WrapResponse(1);
			}
			catch
			{
				return WrapResponse(0);
			}
		}
		[HttpPost]
		[Route("getCurrentPlace")]
		public async Task<IHttpActionResult> GetCurrentPlace(int Id)
		{
			return WrapResponse(await StatisticManager.GetCurrentPlace(Id, CurrentUser.Id));
		}
		[HttpPost]
		[Route("getAuditoriums")]
		public async Task<IHttpActionResult> GetAuditoriums()
		{
			return WrapResponse(await StatisticManager.GetAuditoriums(CurrentUser.Id));
		}
		[HttpPost]
		[Route("getAuditoryInfo")]
		public async Task<IHttpActionResult> GetAuditoryInfo(int Id)
		{
			return WrapResponse(await StatisticManager.GetAuditoryInfo(Id, CurrentUser.Id));
		}
		[HttpPost]
		[Route("setPlaceToUser")]
		public async Task<IHttpActionResult> SetPlaceToUser(TotalModel model)
		{
			return WrapResponse(await StatisticManager.SetPlaceToUser(model.PlaceId, model.UserId, CurrentUser.Id));
		}
		protected StatisticManager StatisticManager
		{
			get
			{
				return Request.GetOwinContext().Get<StatisticManager>();
			}
		}
	}
}