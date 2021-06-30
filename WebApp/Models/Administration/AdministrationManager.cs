using Dapper;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using WebApp.Models.Common;
using WebApp.Models.Statistic;

namespace WebApp.Models.Administration
{
    public class AdministrationManager : Manager
    {

        public AdministrationManager(Concrete concrete) : base(concrete) { }


        public async Task<IEnumerable<UserStatistic>> GetPeopleWithAccess(Guid userUid, int AuditoryId)
        {

            using (var cnt = Concrete.OpenConnection())
            {
                return await cnt.QueryAsync<UserStatistic>("Administrator_AuditoryGetPeopleWithAccess", new { userUid, AuditoryId }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<IEnumerable<UserStatistic>> GetPeopleWithReportAccess(Guid userUid, int AuditoryId)
        {

            using (var cnt = Concrete.OpenConnection())
            {
                return await cnt.QueryAsync<UserStatistic>("Administrator_AuditoryGetPeopleWithReportAccess", new { userUid, AuditoryId }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<bool> HasAccessToReport(Guid userUid, int AuditoryId)
        {

            using (var cnt = Concrete.OpenConnection())
            {
                return await cnt.QueryFirstAsync<bool>("Administrator_HasAccessToReport", new { userUid, AuditoriumId = AuditoryId }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<bool> HasFullAccess(Guid userUid)
        {

            using (var cnt = Concrete.OpenConnection())
            {
                return await cnt.QueryFirstAsync<bool>("Administrator_HasFullAccess", new { userUid }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<IEnumerable<IndexItem>> GetAuditoryList(Guid userUid)
        {

            using (var cnt = Concrete.OpenConnection())
            {
                return await cnt.QueryAsync<IndexItem>("Administrator_GetAuditoriesWithAccess", new { userUid }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<bool> HasAccessToTestingProfile(Guid userUid, int TestingProfileId)
        {

            using (var cnt = Concrete.OpenConnection())
            {
                return await cnt.QueryFirstAsync<bool>("Administrator_HasAccessToTestingProfile", new { userUid, TestingProfileId }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task SetUserToReport(Guid userUid, AccessModel model)
        {

            using (var cnt = Concrete.OpenConnection())
            {
                await cnt.ExecuteAsync("Administrator_SetAccessToReport", new { userUid, model.AuditoriumId, model.DateFrom, model.DateTo, model.IsActive, model.UserId }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task SetUserToAuditory(Guid userUid, AccessModel model)
        {

            using (var cnt = Concrete.OpenConnection())
            {
                await cnt.ExecuteAsync("Administrator_SetAuditoriumAccess", new { userUid, model.AuditoriumId, model.UserId, model.IsActive }, commandType: CommandType.StoredProcedure);
            }
        }
    }
}