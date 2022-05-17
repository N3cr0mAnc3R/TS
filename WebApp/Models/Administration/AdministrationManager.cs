using Dapper;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlTypes;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using WebApp.Models.Common;
using WebApp.Models.Disciplines;
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
        public async Task ResetStatus(Guid userUid, int TestingProfileId)
        {

            using (var cnt = Concrete.OpenConnection())
            {
                await cnt.ExecuteAsync("SuperAdmin_ResetTestingStatus", new { userUid, TestingProfileId }, commandType: CommandType.StoredProcedure);
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
        public async Task<IndexItem> GetUserFamilyById(int UserId)
        {

            using (var cnt = Concrete.OpenConnection())
            {
                return await cnt.QueryFirstAsync<IndexItem>("Administrator_GetUserFamilyNameById", new { UserId }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<int> GetQuestionCount(int disciplineId, int? isActive, Guid UserUid)
        {

            using (var cnt = Concrete.OpenConnection())
            {
                return await cnt.QueryFirstAsync<int>("SuperAdmin_GeNumberOfDisciplineQuestions", new { UserUid, disciplineId, isActive }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task ToggleQuestion(int Id, bool? isActive, Guid UserUid)
        {

            using (var cnt = Concrete.OpenConnection())
            {
                await cnt.ExecuteAsync("SuperAdmin_UpdateDisciplineQuestionActive", new { UserUid, Id, isActive }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<IEnumerable<IndexItem>> GetTestingPassTimes()
        {
            using (var cnt = Concrete.OpenConnection())
            {
                return await cnt.QueryAsync<IndexItem>("Administrator_TestingTimeGet", commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<IEnumerable<IndexItem>> GetTestingTypes()
        {
            using (var cnt = Concrete.OpenConnection())
            {
                return await cnt.QueryAsync<IndexItem>("Administrator_TestingTypeGet", commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<IEnumerable<IndexItem>> GetTestingAnswerTypes()
        {
            using (var cnt = Concrete.OpenConnection())
            {
                return await cnt.QueryAsync<IndexItem>("Administrator_TestingTypeAnswerGet", commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<int> CreateDiscipline(DisciplineModel model)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                return await cnt.QueryFirstAsync<int>("Administrator_CreateDiscipline", new { model.Name, model.NameEn, model.CountOfQuestions, model.Scale, model.TestingTime, model.Year, TestingAlarm = model.TimeAlarm, model.TypeTesting, model.TestingPass }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task UpdateDiscipline(DisciplineModel model)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                await cnt.ExecuteAsync("Administrator_StructureDisciplineSave", new { structureDisciplineId = model.Id, model.DisciplineId, model.CountOfQuestions, model.Scale, model.TestingTime, model.Year, model.TimeAlarm, typeTestingId = model.TypeTesting, model.TestingPass }, commandType: CommandType.StoredProcedure);

            }
        }
        public async Task<IEnumerable<CategoryQuestion>> GetQuestionCategories(int Id)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                return await cnt.QueryAsync<CategoryQuestion>("Administrator_CategoryQuestionsGet", new { structureDisciplineId = Id }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<IEnumerable<CategoryQuestion>> GetQuestionThemes(int Id)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                return await cnt.QueryAsync<CategoryQuestion>("Administrator_ThemesGet", new { structureDisciplineId = Id }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<DisciplineModel> GetStructureDiscipline(int Id, int? year)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                return await cnt.QueryFirstAsync<DisciplineModel>("Administrator_StructureDisciplineGet", new { Id, year }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task SaveQuestionCategory(CategoryQuestion model)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                await cnt.ExecuteAsync("Administrator_CategoryQuestionSave", new { categoryQuestionId = model.Id, model.StructureDisciplineId, model.Name, Name_En = model.NameEn, model.Weight, model.Number, model.Count, model.Rank }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task SaveQuestionTheme(CategoryQuestion model)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                await cnt.ExecuteAsync("Administrator_ThemeSave", new { themeId = model.Id, model.StructureDisciplineId, model.Name, Name_En = model.NameEn, model.IsActive }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<string> GetQuestionImage(int QuestionId)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                return (await cnt.QueryFirstAsync<QuestionModel>("Administrator_QuestionImageGet", new { QuestionId }, commandType: CommandType.StoredProcedure)).QuestionImage;
            }
        }
        public async Task SaveQuestionImage(int QuestionId, string questionImage)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                await cnt.ExecuteAsync("Administrator_QuestionNewImageSave", new { QuestionId, questionImage }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<QuestionUploadModel> SaveQuestionFile(QuestionUploadModel model)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                try
                {
                    var t = await cnt.QueryFirstAsync<QuestionUploadModel>("exec Administrator_QuestionInsert @QuestionId, @ThemeId, @CategoryQuestionId, @question, @TypeAnswerId, @IsActivity",
                                        new
                                        {
                                            @QuestionId = model.Id,
                                            @ThemeId = model.ThemeId,
                                            @CategoryQuestionId = model.CategoryQuestionId,
                                            @question = model.Question,
                                            @TypeAnswerId = model.TypeAnswerId,
                                            @IsActivity = model.IsActivity
                                        }, commandType: CommandType.Text);

                    return t;

                }
                catch (Exception exc)
                {
                    return null;
                }
            }
        }
        public async Task<IEnumerable<QuestionEditModel>> GetDisciplineQuestions(int disciplineId, int Offset, int Count, int? IsActive, Guid UserUid)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                using (var multi = await cnt.QueryMultipleAsync(sql: "[dbo].[SuperAdmin_GetDisciplineQuestionsAndAnswers]", new { disciplineId, Offset, Count, IsActive, UserUid }, commandType: CommandType.StoredProcedure))
                {
                    List<QuestionEditModel> result = (await multi.ReadAsync<QuestionEditModel>()).ToList();
                    List<UserTest.AnswerEditModel> answers = (await multi.ReadAsync<UserTest.AnswerEditModel>()).ToList();

                    foreach (var item in result)
                    {
                        item.Answers = answers.Where(a => a.QuestionId == item.Id);
                    }

                    return result;
                }
            }
        }
        public async Task FastUserLoad(Guid userUID)
        {

            using (var cnt = Concrete.OpenConnection())
            {
                await cnt.ExecuteAsync("SuperAdmin_FastUserLoad", new { userUID }, commandType: CommandType.StoredProcedure);
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
                return await cnt.QueryAsync<IndexItem>("SuperAdmin_DisciplinesGet", new { }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task AssignDisciplineToUser(AssignDisciplineModel model)
        {

            using (var cnt = Concrete.OpenConnection())
            {
                await cnt.ExecuteAsync("SuperAdmin_AssignTestToUser", new { model.UserId, structureDisciplineId = model.DisciplineId, model.PlaceId, testingDate = model.Date }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task DoubleNullified(Guid userUid, int TestingProfileId)
        {

            using (var cnt = Concrete.OpenConnection())
            {
                await cnt.ExecuteAsync("SuperAdmin_ResetNullified", new { userUid, TestingProfileId }, commandType: CommandType.StoredProcedure);
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