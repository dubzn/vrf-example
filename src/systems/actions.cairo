use starknet::ContractAddress;

// define the interface
#[starknet::interface]
pub trait IRandomTest<T> {
    fn get_random_number(ref self: T) -> felt252;
}

#[starknet::interface]
trait IVrfProvider<TContractState> {
    fn request_random(self: @TContractState, caller: ContractAddress, source: Source);
    fn consume_random(ref self: TContractState, source: Source) -> felt252;
}

#[derive(Drop, Copy, Clone, Serde)]
pub enum Source {
    Nonce: ContractAddress,
    Salt: felt252,
}

#[dojo::contract]
pub mod random_test {
    use starknet::get_caller_address;
    use super::{IVrfProviderDispatcher, IVrfProviderDispatcherTrait, Source};

    #[abi(embed_v0)]
    impl RandomTestImpl of super::IRandomTest<ContractState> {
        fn get_random_number(ref self: ContractState) -> felt252 {
            let vrf_provider = IVrfProviderDispatcher { contract_address: 0x051fea4450da9d6aee758bdeba88b2f665bcbf549d2c61421aa724e9ac0ced8f.try_into().unwrap() };
            let random_value = vrf_provider.consume_random(Source::Nonce(get_caller_address()));
            random_value
        }
    }
}
