using Dapper;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using WebApp.Models.Common;
using WebApp.Models.UserTest;

namespace WebApp.Models.Proctoring
{
    public class ProctorManager : Manager
    {
        public ProctorManager(Concrete concrete) : base(concrete) { }

        /// <summary>
        /// Список членов комиссии в чате
        /// </summary>
        /// <param name="TestingProfileId"></param>
        /// <param name="userUID"></param>
        /// <param name="localization"></param>
        /// <returns></returns>
        public async Task<IEnumerable<ProctorUser>> GetProctorUsers(int TestingProfileId, Guid? userUID, string localization = null)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryAsync<ProctorUser>(
                    sql: "[dbo].[Administrator_ChatRoomUsersGet]",
                    new { userUID, TestingProfileId, localization },
                    commandType: CommandType.StoredProcedure
                );
            }
        }
        public async Task<ProctorUser> GetProctorInfo(int TestingProfileId, Guid userUID, string localization = null)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryFirstOrDefaultAsync<ProctorUser>(
                    sql: "[dbo].[Administrator_ExaminationBoardUserIdGet]",
                    new { userUID, TestingProfileId, localization },
                    commandType: CommandType.StoredProcedure
                );
            }
        }
        /// <summary>
        /// Список членов комиссии в чате
        /// </summary>
        /// <param name="TestingProfileId"></param>
        /// <param name="userUID"></param>
        /// <param name="localization"></param>
        /// <returns></returns>
        public async Task<IEnumerable<ProctorUser>> GetProctorUserMembers(int TestingProfileId, Guid? userUID, string localization = null)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryAsync<ProctorUser>(
                    sql: "[dbo].[Administrator_ExaminationBoardsGet]",
                    new { userUID, TestingProfileId, localization },
                    commandType: CommandType.StoredProcedure
                );
            }
        }
        /// <summary>
        /// Вернуть доступные дисциплины для проверки (если в нескольких комиссиях)
        /// </summary>
        /// <param name="userUID"></param>
        /// <param name="localization"></param>
        /// <returns></returns>
        public async Task<IEnumerable<IndexItem>> GetProctorProfiles(Guid userUID, string localization = null)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryAsync<IndexItem>(
                    sql: "[dbo].[Administrator_StructureDisciplinesUserUIDGet]",
                    new { userUID, localization },
                    commandType: CommandType.StoredProcedure
                );
            }
        }
        /// <summary>
        /// Получить список абитуриентов (обезличено)
        /// </summary>
        /// <param name="userUID"></param>
        /// <param name="Id"></param>
        /// <param name="localization"></param>
        /// <returns></returns>
        public async Task<IEnumerable<AnonymUser>> GetProctorTests(Guid userUID, int Id, string localization = null)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryAsync<AnonymUser>(
                    sql: "[dbo].[Administrator_UsersStructureDisciplineIdGet]",
                    new { userUID, localization, structureDisciplineId = Id },
                    commandType: CommandType.StoredProcedure
                );
            }
        }
        /// <summary>
        /// Доступен ли тест для проверки и есть ли у него есть доступ
        /// </summary>
        /// <param name="userUID"></param>
        /// <param name="TestingProfileId"></param>
        /// <param name="localization"></param>
        /// <returns></returns>
        public async Task<bool> IsVerificationAvailable(Guid userUID, int TestingProfileId, string localization = null)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return (await cnt.QueryFirstOrDefaultAsync<AccessModel>(
                    sql: "[dbo].[Administrator_TestingProfileCanCheckGet]",
                    new { userUID, localization, TestingProfileId },
                    commandType: CommandType.StoredProcedure
                )).CanCheck;
            }
        }
        /// <summary>
        /// Получаем данные о тестировании
        /// </summary>
        /// <param name="userUID"></param>
        /// <param name="TestingProfileId"></param>
        /// <param name="localization"></param>
        /// <returns></returns>
        public async Task<IEnumerable<QuestionAnswer>> GetInfoAboutVerification(Guid userUID, int TestingProfileId, string localization = null)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryAsync<QuestionAnswer>(
                    sql: "[dbo].[UserPlace_TestingResultsGet]",
                    new { userUID, localization, TestingProfileId },
                    commandType: CommandType.StoredProcedure
                );
            }
        }
        //public IEnumerable<QuestionAnswer> DownloadAnswerFile(Guid userUID, int answerId, string localization = null)
        //{
        //    using (var cnt = Concrete.OpenConnection())
        //    {
        //        return cnt.Query<QuestionAnswer>(
        //            sql: "[dbo].[Administrator_UserAnswerFileGet]",
        //            new { userUID, localization, answerId },
        //            commandType: CommandType.StoredProcedure
        //        );
        //    }
        //}

        public async Task SaveInfoAboutAnswer(Guid userUID, SaveMarkModel model, string localization = null)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                await cnt.ExecuteAsync(
                    sql: "[dbo].[Administrator_ExaminationBoardTestingResultScoreSave]",
                    new { userUID, localization, examinationBoardId = model.Id, model.TestingResultId, model.Score },
                    commandType: CommandType.StoredProcedure
                );
            }
        }
        public async Task<IEnumerable<AnswerInfoScore>> GetInfoAboutAnswer(int TestingResultId, Guid userUID, string localization = null)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryAsync<AnswerInfoScore>(
                    sql: "[dbo].[Administrator_ExaminationBoardTestingResultScoresGet]",
                    new { userUID = (Guid?)null, localization, TestingResultId },
                    commandType: CommandType.StoredProcedure
                );
            }
        }
        public async Task<IEnumerable<TestResultScore>> GetInfoAboutTest(int TestingProfileId, Guid userUID, string localization = null)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryAsync<TestResultScore>(
                    sql: "[dbo].[Administrator_ExaminationBoardScoresGet]",
                    new { userUID, localization, TestingProfileId },
                    commandType: CommandType.StoredProcedure
                );
            }
        }
        public async Task<ScoreModel> GetMaxScore(int testingResultId, Guid userUID, string localization = null)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryFirstOrDefaultAsync<ScoreModel>(
                    sql: "[dbo].[Administrator_MaxScoreGet]",
                    new { userUID, localization, testingResultId },
                    commandType: CommandType.StoredProcedure
                );
            }
        }
        public async Task<ScoreModel> GetMark(int testingProfileId, Guid userUID, string localization = null)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryFirstOrDefaultAsync<ScoreModel>(
                    sql: "[dbo].[Administrator_TestingProfileScoreGet]",
                    new { userUID, localization, testingProfileId },
                    commandType: CommandType.StoredProcedure
                );
            }
        }
        public async Task<EnrolleeModel> GetEnrolleeInfo(int testingProfileId, Guid? userUID, string localization = null)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryFirstAsync<EnrolleeModel>(sql: "[dbo].[Administrator_TestingProfileInfoGet]", new { testingProfileId, userUID, localization }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task SaveInfoAboutTest(Guid userUID, SaveMarkModel model, string localization = null)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                await cnt.ExecuteAsync(
                    sql: "[dbo].[Administrator_ExaminationBoardScoreSave]",
                    new { userUID, localization, examinationBoardId = model.Id, model.TestingProfileId, model.Score },
                    commandType: CommandType.StoredProcedure
                );
            }
        }
        public async Task SaveMark(Guid userUID, SaveMarkModel model, string localization = null)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                await cnt.ExecuteAsync(
                     sql: "[dbo].[Administrator_TestingProfileScoreSave]",
                     new { userUID, localization, model.TestingProfileId, model.Score },
                     commandType: CommandType.StoredProcedure
                 );
            }
        }

    }
}