using Dapper;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using WebApp.Models.Common;
using WebApp.Models.Statistic;
using WebApp.Models.UserTest;

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
        public async Task<IEnumerable<Place>> GetAuditoryPlacesById(Guid userUid, int AuditoryId)
        {

            using (var cnt = Concrete.OpenConnection())
            {
                return await cnt.QueryAsync<Place>("Administrator_AuditoriumPlacesGet", new { userUid, AuditoriumId = AuditoryId }, commandType: CommandType.StoredProcedure);
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
        public async Task<IEnumerable<IndexItem>> GetDisciplines()
        {

            using (var cnt = Concrete.OpenConnection())
            {
                return await cnt.QueryAsync<IndexItem>("SuperAdmin_DisciplinesGet", new {  }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task AssignDisciplineToUser(AssignDisciplineModel model)
        {

            using (var cnt = Concrete.OpenConnection())
            {
                await cnt.ExecuteAsync("SuperAdmin_AssignTestToUser", new { model.UserId, structureDisciplineId = model.DisciplineId, model.PlaceId, testingDate = model.Date }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task ChangeTestingDate(Guid userUid, TestingModel model)
        {

            using (var cnt = Concrete.OpenConnection())
            {
                await cnt.ExecuteAsync("SuperAdmin_UpdateTestingDate", new { UserUid = userUid, TestingDate = model.TestingDate, TestingProfileId = model.Id }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<IEnumerable<UserAnswer>> GetUserAnswerLog(Guid userUid, int TestingProfileId)
        {

            using (var cnt = Concrete.OpenConnection())
            {
                using (var multi = await cnt.QueryMultipleAsync("SuperAdmin_GetUserAnswerLog", new { userUid, TestingProfileId }, commandType: CommandType.StoredProcedure))
                {
                    var Questions = await multi.ReadAsync<QuestionModel>();
                    var Answers = await multi.ReadAsync<IndexItem>();
                    var Logs = await multi.ReadAsync<UserAnswerLogModel>();
                    List<UserAnswer> Result = new List<UserAnswer>();
                    foreach (var item in Questions)
                    {
                        item.QuestionImage = Cropper.Cropper.CropImageWithFix(item.QuestionImage);
                    }
                    foreach (QuestionModel question in Questions)
                    {
                        UserAnswer ua = new UserAnswer() { Question = question };
                        IEnumerable<UserAnswerLogModel> LocalLogs = Logs.Where(a => a.QuestionId == question.Id);

                        List<UserAnswerModel> model = new List<UserAnswerModel>();

                        foreach (UserAnswerLogModel item in LocalLogs)
                        {
                            model.Add(new UserAnswerModel() { Id = item.AnswerId, Time = item.Time, UserAnswer = item.UserAnswer });
                        }
                        List<AnswerModel> answers = new List<AnswerModel>();
                        foreach (UserAnswerLogModel item in LocalLogs)
                        {
                            if (answers.Any(a => a.Answer.Id == item.AnswerId))
                            {
                                continue;
                            }
                            answers.Add(new AnswerModel() { Answer = Answers.First(a => a.Id == item.AnswerId), IsRight = item.IsRight, UserAnswers = model.Where(b => b.Id == item.AnswerId) });
                        }
                        foreach (var item in answers)
                        {
                            item.Answer.Name = Cropper.Cropper.CropImageWithFix(item.Answer.Name);
                        }
                        ua.Answers = answers;
                        Result.Add(ua);
                    }
                    Result = Result.Where(a => a.Answers.Any()).ToList();
                    return Result;
                }

            }
        }
    }
}