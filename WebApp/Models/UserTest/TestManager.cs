using Dapper;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using WebApp.Models.DB;
using WebApp.Models.UserTest;

namespace WebApp.Models
{
    public class TestManager: Manager
    {
        public TestManager(Concrete concrete) : base(concrete) { }
        public dynamic GetTestsByPlaceConfig(string placeConfig)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                try
                {
                    return cnt.Query<TestingModel>(sql: "[dbo].[UserPlace_TestingProfilesPlaceConfigGet]", new { placeConfig }, commandType: CommandType.StoredProcedure);
                }
                catch(Exception e)
                {
                    return new { Error = e.Message };
                }
            }
        }
        public IEnumerable<TestingPackage> GetTestPackageById(int testingProfileId)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                return cnt.Query<TestingPackage>(sql: "[dbo].[UserPlace_TestingPackagesGet]", new { testingProfileId }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task StartTest(int testingProfileId, Guid userUID)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                cnt.Execute(sql: "[dbo].[UserPlace_TestingStart]", new { testingProfileId, userUID }, commandType: CommandType.StoredProcedure);
            }
        }
        public IEnumerable<TestingPackage> CheckPIN(int pin)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                return cnt.Query<TestingPackage>(sql: "[dbo].[UserPlace_CheckPin]", new { pin }, commandType: CommandType.StoredProcedure);
            }
        }
        public IEnumerable<QwestionModel> GetTestQwestionsById(int testingProfileId)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                return cnt.Query<QwestionModel>(sql: "[dbo].[UserPlace_TestingPackagesQwestionsGet]", new { testingProfileId }, commandType: CommandType.StoredProcedure);
            }
        }
        public IEnumerable<AnswerModel> GetTestAnswersById(int testingProfileId)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                return cnt.Query<AnswerModel>(sql: "[dbo].[UserPlace_TestingPackagesAnswersGet]", new { testingProfileId }, commandType: CommandType.StoredProcedure);
            }
        }
        public IEnumerable<QwestionModel> GetQwestionImage(int qwestionId)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                return cnt.Query<QwestionModel>(sql: "[dbo].[UserPlace_QwestionImageGet]", new { qwestionId }, commandType: CommandType.StoredProcedure);
            }
        }
        public IEnumerable<AnswerModel> GetAnswerImage(int answerId)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                return cnt.Query<AnswerModel>(sql: "[dbo].[UserPlace_AnswerImageGet]", new { answerId }, commandType: CommandType.StoredProcedure);
            }
        }
        public void UpdateQwestionAnswer(IEnumerable<QwestionAnswer> testingLogs)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                var t = testingLogs.Select(a => new { testingPackageId = a.TestingPackageId, time = DateTime.Now, testingTime = a.TestingTime,  userAnswer = a.UserAnswer });
                cnt.Execute(sql: "[dbo].[UserPlace_TestingLogsSave]", new StructuredDynamicParameters(new{ testingLogs = t.ToArray() }), commandType: CommandType.StoredProcedure);
            }
        }
    }
}