import { storage, } from "near-sdk-core";
import { logging, RNG, Context, u128, ContractPromiseBatch } from "near-sdk-as";
import { AccountId, ONE_NEAR, asNEAR, XCC_GAS } from "../../utils";


@nearBindgen
export class MontyHallGame {

  private owner: AccountId;
  private current_player: AccountId;
  private pot: u128 = ONE_NEAR;
  private fee: u128 = ONE_NEAR;
  private stage: u32 = 0;
  private winningDoor: u32 = -1;
  private firstChoice: u32 = -1;
  private secondChoice: u32 = -1;

  constructor(owner: AccountId) {
    this.owner = owner;
  };

  // --------------------------------------------------------------------------
  // Public VIEW methods
  // --------------------------------------------------------------------------

  get_owner(): AccountId {
    return this.owner;
  }

  get_pot(): string {
    return asNEAR(this.pot) + " NEAR";
  }

  get_fee(): string {
    return asNEAR(this.fee) + " NEAR";
  }

  @mutateState()
  start_game(): void {
    assert(this.stage == 0, this.current_player + " is currently playing.");

    const fee = this.fee;
    assert(Context.attachedDeposit >= fee, "Playing costs " + asNEAR(fee) + " NEAR");
    this.increase_pot();

    this.current_player = Context.sender;
    this.stage = 1;

    this.make_turn();
  }

  @mutateState()
  make_turn(choice: u32 = -1): void {
    if (this.stage == 0) {
      logging.log("\n\n" +
        "The game is not started. Please call start_game method.\n"
      );
    } else if (this.stage == 1) {
      const rng = new RNG<u32>(1, u32.MAX_VALUE);
      this.winningDoor = rng.next() % 3 + 1;

      // request first choice
      logging.log("\n\n" +
        "Welcome to the Monty Hall game!\n" +
        "Here are three doors. Behind one door is " + this.get_pot() + ".\n" +
        "Behind the other two are goats (TODO: implement NFT goat).\n" +
        "Choose your door:\n" +
        "  🚪    🚪    🚪  \n" +
        "   1     2     3  \n"
      );

      logging.log(
        this.winningDoor.toString() +
          " " + this.firstChoice.toString() +
          " " + this.secondChoice.toString()
      );

      this.stage = 2;
    } else if (this.stage == 2) {
      this.firstChoice = choice;

      var canOpen: Array<u32> = [];
      for (var door = 1; door <= 3; door++) {
        if (door != this.winningDoor && door != this.firstChoice) {
          canOpen.push(door);
        }
      }

      const rng = new RNG<u32>(1, u32.MAX_VALUE);
      const openDoor = canOpen[rng.next() % canOpen.length];
      assert(openDoor != this.winningDoor);
      assert(openDoor != this.firstChoice);

      var doorImgs: Array<string> = ["", "🚪", "🚪", "🚪"];
      doorImgs[openDoor] = "🐐";
      const doorString = "  " + doorImgs[1] + "    " + doorImgs[2] + "    " + doorImgs[3] + "  ";

      this.secondChoice = 6 - this.firstChoice - openDoor;

      // offer second choice
      logging.log("\n\n" +
        "You chose door " + this.firstChoice.toString() + ".\n" +
        "I open door " + openDoor.toString() + " and there's a goat!\n" +
        "Do you want to switch your choice to door " + this.secondChoice.toString() + "?\n" +
        "Choose your door:\n" +
        doorString + "\n" +
        "   1     2     3  \n"
      );

      logging.log(
        this.winningDoor.toString() +
          " " + this.firstChoice.toString() +
          " " + this.secondChoice.toString()
      );

      this.stage = 3;
    } else if (this.stage == 3) {

      if (choice != this.firstChoice && choice != this.secondChoice) {
        logging.log("\n\n" +
          "Door " + choice.toString() + " is already open.\n" +
          "Choose another door!\n"
        );
        return;
      }

      var resultImgs: Array<string> = ["", "🐐", "🐐", "🐐"];
      resultImgs[this.winningDoor] = "💰";
      const doorString = "  " + resultImgs[1] + "    " + resultImgs[2] + "    " + resultImgs[3] + "  ";
      logging.log("\n\n" +
        "You chose door " + choice.toString() + ".\n" +
        "What was behind the doors:\n" +
        doorString + "\n" +
        "   1     2     3  \n"
      );

      if (choice == this.winningDoor) {
        this.win();
      } else {
        this.lose();
      }
      this.reset();
    }
  }

  @mutateState()
  reset(): void {
    this.current_player = "";
    this.stage = 0;
    this.winningDoor = -1;
    this.firstChoice = -1;
    this.secondChoice = -1;
  }

  // this method is only here for the promise callback,
  // it should never be called directly
  @mutateState()
  on_payout_complete(): void {
    this.assert_self();
    this.stage = 0;
    this.pot = ONE_NEAR;
    logging.log("\n\n" +
      "Game over.\n"
    );
  }

  private win(): void {
    logging.log("\n\n" +
      "You (" + this.current_player + ") won " + this.get_pot() + "!\n"
    );

    if (this.current_player.length > 0) {
      const to_winner = ContractPromiseBatch.create(this.current_player);
      const self = Context.contractName;

      // transfer payout to winner
      to_winner.transfer(this.pot);

      // receive confirmation of payout before setting game to inactive
      to_winner.then(self).function_call("on_payout_complete", "{}", u128.Zero, XCC_GAS);
    }
  }

  private lose(): void {
    logging.log("\n\n" +
      "You (" + this.current_player + ") did not win.\n" +
      "The pot is currently " + this.get_pot() + ".\n"
    );
  }

  private increase_pot(): void {
    this.pot = u128.add(this.pot, Context.attachedDeposit);
  }

  private assert_self(): void {
    const caller = Context.predecessor
    const self = Context.contractName
    assert(caller == self, "Only this contract may call itself");
  }
}