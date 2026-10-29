// Приклади коду до доповіді «Основні рекомендації написання коду для Scala»
// Турчин Артем, ПЗПІ-24-3

// ============================================================
// Г.1 Форматування коду
// ============================================================
// Погано
def area(w:Int,h:Int):Int={w*h}

// Добре
def area(width: Int, height: Int): Int =
  width * height

// ============================================================
// Г.2 Іменування
// ============================================================
// Погано
object cv {
  def v(a: Int) = a >= 1 && a <= 100
}

// Добре
object CommandValidator:
  val MaxAmount = 100

  def isValidAmount(amount: Int): Boolean =
    amount >= 1 && amount <= MaxAmount

// ============================================================
// Г.3 Структура проєкту і файлів
// ============================================================
// pract1/
// ├── build.sbt
// ├── .scalafmt.conf
// └── src/
//     ├── main/scala/ua/nure/actions/
//     │   └── CommandValidator.scala
//     └── test/scala/ua/nure/actions/
//         └── CommandValidatorSuite.scala

// ============================================================
// Г.4 Незмінність даних
// ============================================================
// Погано
var amount = 1
amount = amount + 1

// Добре
case class Item(code: String, amount: Int)

val first  = Item("milk", 1)
val second = first.copy(amount = 2)

// ============================================================
// Г.5 Функціональний стиль
// ============================================================
// Погано
var total = 0
for (c <- commands)
  if (c.amount > 0) total += c.amount

// Добре
val total = commands
  .filter(_.amount > 0)
  .map(_.amount)
  .sum

// ============================================================
// Г.6 Типи та обробка помилок
// ============================================================
// Погано
def find(code: String): AllowedAction =
  if (catalog.contains(code)) catalog(code)
  else null

// Добре
enum CommandError:
  case UnknownAction(code: String)

def findAction(code: String)
    : Either[CommandError, AllowedAction] =
  catalog
    .get(code)
    .toRight(CommandError.UnknownAction(code))

// ============================================================
// Г.7 Коментарі та Scaladoc
// ============================================================
// Погано
// додаємо 1 до amount
amount = amount + 1

// Добре
/** Перевіряє код дії та кількість.
  *
  * @param code   код дії із запиту
  * @param amount кількість від 1 до 100
  * @return команда або опис помилки
  */
def validate(code: String, amount: Int)
    : Either[CommandError, Command]

// ============================================================
// Г.8 Тестування та інструменти
// ============================================================
// Тест (MUnit)
class CommandValidatorSuite
    extends munit.FunSuite:

  test("відхиляє недозволену дію") {
    val result = validate(catalog, "x", 1)
    assert(result.isLeft)
  }

// .scalafmt.conf
// runner.dialect = scala3
// maxColumn = 100
